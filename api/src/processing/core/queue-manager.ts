import { Express } from "express";

import { ProcessingItemType, ProcessingItemWithPlaylist } from "../../types";
import { handleDownload } from "../download/download-handler";
import { postProcessLidarr } from "../post-processing/lidarr-post-processor";
import { postProcessTidarr } from "../post-processing/tidarr-post-processor";
import { cleanFolder } from "../utils/jobs";

/**
 * Manages the parallel processing queue with 1 download slot and 1 post-processing slot
 */
export class QueueManager {
  private data: ProcessingItemType[];
  private app: Express;
  private isPaused: boolean;
  private outputs: Map<string, string[]>;
  private updateItemCallback: (item: ProcessingItemType) => void;
  private updateItemInQueueFileCallback: (
    item: ProcessingItemType,
  ) => Promise<void>;

  constructor(
    data: ProcessingItemType[],
    app: Express,
    outputs: Map<string, string[]>,
    updateItemCallback: (item: ProcessingItemType) => void,
    updateItemInQueueFileCallback: (item: ProcessingItemType) => Promise<void>,
  ) {
    this.data = data;
    this.app = app;
    this.isPaused = false;
    this.outputs = outputs;
    this.updateItemCallback = updateItemCallback;
    this.updateItemInQueueFileCallback = updateItemInQueueFileCallback;
  }

  /**
   * Prepares an item for download
   */
  async prepareDownload(item: ProcessingItemType): Promise<void> {
    item["status"] = "download";
    this.updateItemCallback(item);

    // Initialize empty output history
    this.outputs.set(String(item.id), []);

    await cleanFolder(item.id);
  }

  /**
   * Prepares an item for post-processing
   */
  async preparePostProcessing(item: ProcessingItemType): Promise<void> {
    item["status"] = "processing";
    this.updateItemCallback(item);
  }

  /**
   * Processes the queue - starts download and post-processing if slots available
   */
  async processQueue(): Promise<void> {
    if (this.isPaused) return;

    const isDownloading = this.data.some((item) => item.status === "download");
    const isPostProcessing = this.data.some(
      (item) => item.status === "processing",
    );

    if (!isDownloading) {
      const nextDownload = this.data.find(
        (item) => item.status === "queue_download",
      );

      if (nextDownload) {
        await this.prepareDownload(nextDownload);
        this.startDownload(nextDownload);
      }
    }

    if (!isPostProcessing) {
      const nextPostProcess = this.data.find(
        (item) => item.status === "queue_processing",
      );

      if (nextPostProcess) {
        await this.preparePostProcessing(nextPostProcess);
        this.startPostProcessing(nextPostProcess);
      }
    }
  }

  /**
   * Starts downloading an item
   */
  private startDownload(item: ProcessingItemType): void {
    handleDownload(item, this.app, async (playlistId) => {
      // Download completed
      delete item.process;

      // For LIDARR items, go straight to post-processing
      if (item.source === "lidarr") {
        item.status = "processing";
        this.updateItemCallback(item);
        await this.updateItemInQueueFileCallback(item);

        // Start Lidarr post-processing immediately
        postProcessLidarr(item, () => {
          this.onPostProcessingComplete(item);
        });

        // Trigger download of next item
        this.processQueue();
        return;
      }

      // For TIDARR items, move to post-processing queue
      item.status = "queue_processing";

      // Store playlistId for cleanup after post-processing
      if (playlistId) {
        (item as ProcessingItemWithPlaylist).playlistId = playlistId;
      }

      this.updateItemCallback(item);
      await this.updateItemInQueueFileCallback(item);

      // Trigger next items in queue
      this.processQueue();
    });
  }

  /**
   * Starts post-processing an item
   */
  private startPostProcessing(item: ProcessingItemType): void {
    postProcessTidarr(item, () => {
      this.onPostProcessingComplete(item);
    });
  }

  /**
   * Called when post-processing completes
   */
  private async onPostProcessingComplete(
    item: ProcessingItemType,
  ): Promise<void> {
    // Update item in queue file
    await this.updateItemInQueueFileCallback(item);

    // Update item status
    this.updateItemCallback(item);

    // Trigger next items in queue
    this.processQueue();
  }

  /**
   * Pauses the queue
   */
  setPaused(paused: boolean): void {
    this.isPaused = paused;
  }

  /**
   * Gets the pause state
   */
  isPausedState(): boolean {
    return this.isPaused;
  }
}
