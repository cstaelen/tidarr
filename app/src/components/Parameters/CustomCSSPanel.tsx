import { useEffect } from "react";
import { Box, Button, CircularProgress, TextField } from "@mui/material";
import { useCustomCSS } from "src/hooks/useCustomCSS";

export default function CustomCSSPanel() {
  const {
    css,
    setCSS,
    isDirty,
    setIsDirty,
    isSaving,
    isLoading,
    loadCustomCSS,
    saveCustomCSS,
  } = useCustomCSS();

  useEffect(() => {
    loadCustomCSS();
  }, [loadCustomCSS]);

  const handleSave = async () => {
    await saveCustomCSS();
    window.location.reload();
  };

  return (
    <Box>
      <h3>Custom CSS</h3>
      {isLoading ? (
        <Box display="flex" justifyContent="center" p={2}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TextField
            fullWidth
            multiline
            rows={10}
            value={css}
            onChange={(e) => {
              setCSS(e.target.value);
              setIsDirty(true);
            }}
            placeholder="/* Add your custom CSS here */"
          />
          <Box mt={2}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!isDirty || isSaving}
            >
              {isSaving ? <CircularProgress size={24} /> : "Save & Reload"}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
