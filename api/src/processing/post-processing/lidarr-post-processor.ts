import { NZB_DOWNLOAD_PATH } from "../../../constants";
import { ProcessingItemType } from "../../types";
import { hasFileToMove } from "../utils/jobs";
import { logs } from "../utils/logs";

/**
 * Performs Lidarr post-processing (minimal - just marks as ready for Lidarr import)
 * @param item - The processing item (source: "lidarr")
 * @param onComplete - Callback when post-processing completes
 */
export async function postProcessLidarr(
  item: ProcessingItemType,
  onComplete: () => void,
) {
  const processingPath = `${NZB_DOWNLOAD_PATH}/${item.id}`;

  // Check if there are files to process
  const hasFile = await hasFileToMove(processingPath);

  if (!hasFile) {
    logs(item.id, "⚠️ [LIDARR] No file to process.");
    item["status"] = "finished";
    onComplete();
    return;
  }

  // Lidarr will handle all post-processing
  logs(
    item.id,
    "📦 [LIDARR] Lidarr-managed download: skipping Tidarr post-processing",
  );

  logs(item.id, "---------------------");
  logs(
    item.id,
    `✅ [LIDARR] Download complete. Ready for Lidarr import: ${processingPath}`,
  );

  item["status"] = "finished";

  // Trigger completion callback
  onComplete();
}
