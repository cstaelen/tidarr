import WebSocket from "ws";

import { logs } from "../processing/utils/logs";
import {
  PendingPlaylist,
  PlexNotification,
  ProcessingItemType,
} from "../types";

const TIMEOUT_MS = 5 * 60 * 1000; // 5 MINUTES
const TIMEOUT_CHECK_INTERVAL_MS = 30 * 1000; // 30 SECONDS
const RECONNECT_BASE_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30 * 1000; // 30 SECONDS

class PlexMonitor {
  private ws: WebSocket | null = null;
  private pendingPlaylists: Map<string, PendingPlaylist> = new Map();
  private timeoutCheckInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private isShuttingDown = false;

  start() {
    if (!this.isConfigured()) {
      return;
    }

    console.log("🔌 [PLEX] Starting Plex monitor...");
    this.connect();
    this.startTimeoutChecker();
  }

  stop() {
    this.isShuttingDown = true;

    if (this.timeoutCheckInterval) {
      clearInterval(this.timeoutCheckInterval);
      this.timeoutCheckInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.pendingPlaylists.forEach((pending) => {
      this.executeUpload(pending);
    });
    this.pendingPlaylists.clear();

    console.log("🔌 [PLEX] Plex monitor stopped");
  }

  registerPendingPlaylist(item: ProcessingItemType, foldersToScan: string[]) {
    const pending: PendingPlaylist = {
      itemId: item.id,
      item,
      foldersToScan,
      pendingFolders: new Set(foldersToScan),
      createdAt: Date.now(),
    };

    this.pendingPlaylists.set(item.id, pending);
    logs(
      item.id,
      `🕐 [PLEX] Waiting for ${foldersToScan.length} scan(s) to complete before playlist upload`,
    );
  }

  private isConfigured(): boolean {
    return !!(
      process.env.PLEX_URL &&
      process.env.PLEX_TOKEN &&
      process.env.PLEX_LIBRARY
    );
  }

  private getWebSocketUrl(): string {
    const plexUrl = process.env.PLEX_URL!;
    const wsProtocol = plexUrl.startsWith("https") ? "wss" : "ws";
    const host = plexUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `${wsProtocol}://${host}/:/websockets/notifications?X-Plex-Token=${process.env.PLEX_TOKEN}`;
  }

  private connect() {
    if (this.isShuttingDown) return;

    try {
      const url = this.getWebSocketUrl();
      this.ws = new WebSocket(url);

      this.ws.on("open", () => {
        console.log("🔌 [PLEX] WebSocket connected");
        this.reconnectAttempts = 0;
      });

      this.ws.on("message", (data) => {
        this.handleMessage(data.toString());
      });

      this.ws.on("close", () => {
        if (!this.isShuttingDown) {
          console.log("🔌 [PLEX] WebSocket disconnected, reconnecting...");
          this.scheduleReconnect();
        }
      });

      this.ws.on("error", (error) => {
        console.error(`🔌 [PLEX] WebSocket error: ${error.message}`);
      });
    } catch (error) {
      console.error(`🔌 [PLEX] Failed to connect: ${(error as Error).message}`);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.isShuttingDown) return;

    const delay = Math.min(
      RECONNECT_BASE_DELAY_MS * Math.pow(2, this.reconnectAttempts),
      MAX_RECONNECT_DELAY_MS,
    );
    this.reconnectAttempts++;

    setTimeout(() => this.connect(), delay);
  }

  private handleMessage(data: string) {
    try {
      const notification: PlexNotification = JSON.parse(data);
      const container = notification.NotificationContainer;

      if (container.type !== "activity") return;
      if (!container.ActivityNotification) return;

      for (const activityNotif of container.ActivityNotification) {
        const activity = activityNotif.Activity;

        if (activityNotif.event !== "ended") continue;
        if (activity.type !== "library.update.section") continue;

        const scannedPath = activity.subtitle || "";
        this.markFolderScanned(scannedPath);
      }
    } catch {
      // Ignore parse errors
    }
  }

  private markFolderScanned(scannedPath: string) {
    const normalizedScanned = scannedPath.replace(" - ", "/");

    for (const [itemId, pending] of this.pendingPlaylists) {
      for (const folder of pending.pendingFolders) {
        if (
          normalizedScanned.includes(folder) ||
          folder.includes(normalizedScanned) ||
          normalizedScanned === folder
        ) {
          pending.pendingFolders.delete(folder);
          logs(
            itemId,
            `✅ [PLEX] Scan completed for: ${folder} (${pending.pendingFolders.size} remaining)`,
          );

          if (pending.pendingFolders.size === 0) {
            this.executeUpload(pending);
            this.pendingPlaylists.delete(itemId);
          }
          break;
        }
      }
    }
  }

  private async executeUpload(pending: PendingPlaylist) {
    const { uploadPlaylist } = await import("./plex");
    try {
      await uploadPlaylist(pending.item, pending.foldersToScan);
    } catch (error) {
      logs(
        pending.itemId,
        `❌ [PLEX] Playlist upload failed: ${(error as Error).message}`,
      );
    }
  }

  private startTimeoutChecker() {
    this.timeoutCheckInterval = setInterval(() => {
      const now = Date.now();

      for (const [itemId, pending] of this.pendingPlaylists) {
        if (now - pending.createdAt > TIMEOUT_MS) {
          logs(
            itemId,
            `⚠️ [PLEX] Scan timeout reached, uploading playlist anyway (${pending.pendingFolders.size} scans incomplete)`,
          );
          this.executeUpload(pending);
          this.pendingPlaylists.delete(itemId);
        }
      }
    }, TIMEOUT_CHECK_INTERVAL_MS);
  }
}

export const plexMonitor = new PlexMonitor();

export function startPlexMonitor() {
  plexMonitor.start();
}

export function stopPlexMonitor() {
  plexMonitor.stop();
}
