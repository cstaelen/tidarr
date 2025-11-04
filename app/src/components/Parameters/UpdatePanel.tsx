import { Link, Paper, styled } from "@mui/material";
import Markdown from "markdown-to-jsx";
import { TIDARR_REPO_URL } from "src/contants";
import { useConfigProvider } from "src/provider/ConfigProvider";

export default function UpdatePanel() {
  const { config, isUpdateAvailable, releaseData, changeLogData } =
    useConfigProvider();
  return (
    <>
      <p>Current version: Tidarr {config?.TIDARR_VERSION}</p>
      {isUpdateAvailable ? (
        <>
          <Paper sx={{ p: 2 }}>
            <strong>Update available: {releaseData?.name}</strong>
          </Paper>
          <p>To update image stop container and run :</p>
          <Paper sx={{ p: 2 }}>
            <code>docker compose pull tidarr</code>
          </Paper>
        </>
      ) : (
        <Paper sx={{ p: 2 }}>
          <strong>
            {isUpdateAvailable
              ? `Update available: ${releaseData?.name}`
              : "Tidarr is up to date."}
          </strong>
        </Paper>
      )}
      {releaseData?.body && (
        <>
          <p>Changelog</p>
          <Paper
            sx={{
              maxWidth: "100%",
              maxHeight: "300px",
              fontSize: "12px",
              overflow: "auto",
              px: 2,
            }}
          >
            {changeLogData?.map((item, index) => (
              <code key={index}>
                <MarkdownStyled options={{ wrapper: "article" }}>
                  {item}
                </MarkdownStyled>
              </code>
            ))}
          </Paper>
          <br />
          <Link
            target="_BLANK"
            href={`https://github.com/${TIDARR_REPO_URL}/releases`}
          >
            See older releases
          </Link>
        </>
      )}
    </>
  );
}

const MarkdownStyled = styled(Markdown)`
  a {
    color: rgb(144, 202, 249);
  }

  ul {
    padding-left: 1rem;
  }
`;
