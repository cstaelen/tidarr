import { useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Box, Button, CircularProgress, Portal } from "@mui/material";
import { useFileEdit } from "src/hooks/useFileEdit";
import { useApiFetcher } from "src/provider/ApiFetcherProvider";

export default function TiddlConfigEdit() {
  const {
    actions: { get_tiddl_toml, set_tiddl_toml },
  } = useApiFetcher();

  const {
    content,
    setContent,
    isDirty,
    setIsDirty,
    isSaving,
    isLoading,
    loadFileContent,
    saveFileContent,
  } = useFileEdit(get_tiddl_toml, set_tiddl_toml);

  useEffect(() => {
    loadFileContent();
  }, [loadFileContent]);

  const handleSave = async () => {
    await saveFileContent();
    window.location.reload();
  };

  return (
    <Box>
      {isLoading ? (
        <Box display="flex" justifyContent="center" p={2}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box
            sx={{
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 1,
              maxHeight: "320px",
            }}
          >
            <Editor
              height="500px"
              defaultLanguage="ini"
              theme="vs-dark"
              value={content}
              onChange={(value) => {
                setContent(value || "");
                setIsDirty(true);
              }}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
              }}
            />
          </Box>
          <Portal
            container={() => document.getElementById("portal-config-actions")}
          >
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!isDirty || isSaving}
            >
              {isSaving ? <CircularProgress size={24} /> : "Save & Reload"}
            </Button>
          </Portal>
        </>
      )}
    </Box>
  );
}
