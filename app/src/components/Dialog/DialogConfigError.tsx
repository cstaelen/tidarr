import ErrorIcon from "@mui/icons-material/Error";
import { List, ListItem, ListItemText, Paper } from "@mui/material";
import { useConfigProvider } from "src/provider/ConfigProvider";

import { DialogHandler } from ".";

export const DialogConfigError = () => {
  const {
    configErrors,
    actions: { setConfigErrors },
  } = useConfigProvider();

  return (
    <DialogHandler
      open={!!configErrors && configErrors.length > 0}
      onClose={() => setConfigErrors(undefined)}
      title={"Tiddl Configuration Error"}
      icon={<ErrorIcon color="error" />}
    >
      <p>
        An error occurred while loading the Tiddl configuration file.
        <br />
        Please check your <code>config.toml</code> file for syntax errors.
      </p>
      <Paper elevation={0} sx={{ padding: "1rem" }}>
        <code>shared/.tiddl/config.toml</code>
      </Paper>
      {configErrors && configErrors.length > 0 && (
        <>
          <p>Error details:</p>
          <Paper
            elevation={0}
            sx={{ padding: "1rem", maxHeight: "300px", overflow: "auto" }}
          >
            <List dense>
              {configErrors.map((error, index) => (
                <ListItem key={index} disablePadding>
                  <ListItemText
                    primary={
                      <code style={{ fontSize: "0.875rem" }}>{error}</code>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </>
      )}
    </DialogHandler>
  );
};
