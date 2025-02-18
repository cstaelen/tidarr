import { InfoRounded } from "@mui/icons-material";
import { Link } from "@mui/material";
import { useConfigProvider } from "src/provider/ConfigProvider";

import { DialogHandler } from ".";

export const DialogUpdateMessage = () => {
  const { config, showUpdateMessage, actions } = useConfigProvider();

  return (
    <DialogHandler
      open={showUpdateMessage && config?.TIDARR_VERSION === "0.1.15"}
      onClose={() => actions.setShowUpdateMessage(false)}
      title={"Configuration system update"}
      icon={<InfoRounded color="warning" />}
      maxWidth="sm"
    >
      <p>
        <strong>
          Important update: configuration changes starting from version{" "}
          <code>0.1.15</code>
        </strong>
      </p>
      <p>
        To migrate custom download options (quality, format, ...) from previous
        versions, you will need to edit the{" "}
        <strong>
          <code>.tiddl.json</code>
        </strong>{" "}
        file in your Docker shared config directory.
      </p>
      <p>
        For more detailed information, please refer to our further reading
        documentation.
        <Link
          href="https://github.com/cstaelen/tidarr?tab=readme-ov-file#download-settings-optional"
          target="_blank"
        >
          Read more.
        </Link>
      </p>
    </DialogHandler>
  );
};
