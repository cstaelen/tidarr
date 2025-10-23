import { useCallback, useState } from "react";
import { useApiFetcher } from "src/provider/ApiFetcherProvider";

export function useCustomCSS() {
  const {
    actions: { get_custom_css, save_custom_css },
  } = useApiFetcher();

  const [css, setCSS] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadCustomCSS = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await get_custom_css();
      if (result?.css) {
        setCSS(result.css);
        setIsDirty(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [get_custom_css]);

  const saveCustomCSS = useCallback(async () => {
    setIsSaving(true);
    try {
      await save_custom_css(css);
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  }, [css, save_custom_css]);

  return {
    css,
    setCSS,
    isDirty,
    setIsDirty,
    isSaving,
    isLoading,
    loadCustomCSS,
    saveCustomCSS,
  };
}
