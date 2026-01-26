import { NZB_DOWNLOAD_PATH } from "../../../constants";
import { applyReplayGain } from "../../services/rsgain";
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
  const hasFile = await hasFileToMove(processingPath);

  if (!hasFile) {
    logs(item.id, "⚠️ [LIDARR] No file to process.");
  } else {
    await applyReplayGain(item.id, processingPath);

    logs(
      item.id,
      "📦 [LIDARR] Lidarr-managed download: skipping Tidarr post-processing",
    );
    logs(item.id, "---------------------");
    logs(
      item.id,
      `✅ [LIDARR] Download complete. Ready for Lidarr import: ${processingPath}`,
    );
  }

  item.status = "finished";
  onComplete();
}
