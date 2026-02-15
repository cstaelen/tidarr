import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Download } from "@mui/icons-material";
import { CircularProgress, SpeedDial } from "@mui/material";
import { blue } from "@mui/material/colors";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { useProcessingProvider } from "src/provider/ProcessingProvider";

export const ProcessingButton = () => {
  const { processingList, isPaused } = useProcessingProvider();

  const { config, actions } = useConfigProvider();
  const navigate = useNavigate();

  const isLoading = processingList
    ? processingList?.filter(
        (item) =>
          item?.loading === true ||
          item.status === "processing" ||
          item.status === "queue_download" ||
          item.status === "queue_processing",
      )?.length > 0
    : false;
  const hasError = processingList
    ? processingList?.filter((item) => item?.status === "error")?.length > 0
    : false;

  let buttonColor: "primary" | "error" | "warning" | "success" | "inherit";
  switch (true) {
    case isPaused:
      buttonColor = "warning";
      break;
    case hasError:
      buttonColor = "error";
      break;
    case isLoading || config?.NO_DOWNLOAD === "true":
      buttonColor = "primary";
      break;
    case !processingList || processingList?.length === 0:
      buttonColor = "primary";
      break;
    default:
      buttonColor = "success";
  }

  const processingButton = (
    <>
      {isLoading && !isPaused && (
        <CircularProgress
          size={68}
          sx={{
            color: blue[500],
            position: "absolute",
            top: -6,
            left: -6,
            zIndex: 1,
          }}
        />
      )}
      {!processingList || processingList?.length === 0 ? (
        <Download />
      ) : (
        <strong>
          {
            processingList?.filter((item) => item?.status === "finished")
              ?.length
          }
          /{processingList?.length || 0}
        </strong>
      )}
    </>
  );

  useEffect(() => {
    if (hasError) {
      actions.checkAPI();
    }
  }, [hasError]);

  return (
    <SpeedDial
      ariaLabel="Show processing list"
      sx={{
        position: "fixed",
        bottom: 50,
        right: 16,
        zIndex: "2000",
      }}
      icon={processingButton}
      FabProps={{
        color: buttonColor,
      }}
      onClick={() => navigate("/processing")}
    ></SpeedDial>
  );
};
