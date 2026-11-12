import { useNavigate } from "react-router-dom";
import styled from "@emotion/styled";
import { GitHub } from "@mui/icons-material";
import { Button, Link, useTheme } from "@mui/material";
import { TIDARR_REPO_URL } from "src/contants";
import { useConfigProvider } from "src/provider/ConfigProvider";

export const Footer = () => {
  const { isUpdateAvailable, config } = useConfigProvider();
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Support className="footer">
      👋&nbsp;
      <strong>
        Private use only. Do not forget to support your local artists 🙏❤️
      </strong>{" "}
      &nbsp;•&nbsp;Tidarr&nbsp;•&nbsp;
      {config?.TIDARR_VERSION && (
        <>
          <span>{`v${config?.TIDARR_VERSION}`}</span>
          &nbsp;•&nbsp;
        </>
      )}
      {isUpdateAvailable && (
        <Button
          size="small"
          sx={{ color: "warning.main" }}
          onClick={() => navigate("/parameters")}
          color="warning"
        >
          <strong>Update available</strong>
        </Button>
      )}
      &nbsp;
      <Link
        href={`https://github.com/${TIDARR_REPO_URL}`}
        target="_blank"
        sx={{
          verticalAlign: "middle",
          color: theme.palette.common.white,
          paddingLeft: "0.5rem",
        }}
      >
        <GitHub />
      </Link>
    </Support>
  );
};

const Support = styled.div`
  align-items: center;
  background-color: rgb(54, 54, 54);
  display: flex;
  font-size: 0.825rem;
  font-weight: normal;
  justify-content: center;
  padding: 0.3rem;
  position: fixed;
  text-align: center;
  bottom: 0;
  left: 0;
  line-height: 1.2;
  width: 100%;
  z-index: 1000;

  @media screen and (max-width: 40rem) {
    display: block;

    svg {
      vertical-align: middle;
      width: 1.25rem;
    }
  }
`;
