import { useEffect } from "react";
import { useProcessingProvider } from "src/provider/ProcessingProvider";

/**
 * Component that updates the browser tab title with processing count
 */
export function DocumentTitle() {
  const { processingList, isPaused } = useProcessingProvider();

  useEffect(() => {
    if (!processingList || processingList.length === 0) {
      document.title = "Tidarr";
      return;
    }

    // Count finished items
    const finishedCount = processingList.filter(
      (item) => item.status === "finished",
    ).length;
    const totalCount = processingList.length;

    // Check if any item is currently processing
    const hasProcessing = processingList.some(
      (item) => item.status === "processing",
    );

    // Add icon based on state
    let prefix = "";
    if (isPaused) {
      prefix = "⏸️ ";
    } else if (hasProcessing) {
      prefix = "⏳ ";
    }

    document.title = `${prefix}(${finishedCount}/${totalCount}) Tidarr`;
  }, [processingList, isPaused]);

  return null;
}
