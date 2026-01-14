import { useEffect } from "react";

/**
 * Hook to update the document title
 * @param title - The title to set
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
