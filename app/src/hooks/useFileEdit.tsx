import { useCallback, useState } from "react";

export function useFileEdit(
  getter: () => Promise<string | undefined>,
  setter: (content: string) => void,
) {
  const [content, setContent] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadFileContent = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getter();
      if (result) {
        setContent(result);
        setIsDirty(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [getter]);

  const saveFileContent = useCallback(async () => {
    setIsSaving(true);
    try {
      await setter(content);
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  }, [content, setter]);

  return {
    content,
    setContent,
    isDirty,
    setIsDirty,
    isSaving,
    isLoading,
    loadFileContent,
    saveFileContent,
  };
}
