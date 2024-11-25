import styled from "@emotion/styled";
import { GitHub, Warning } from "@mui/icons-material";
import { Button, Link, useTheme } from "@mui/material";
import { useConfigProvider } from "src/provider/ConfigProvider";

export const Footer = () => {
  const { isUpdateAvailable, actions } = useConfigProvider();
  const theme = useTheme();

  return (
    <Support className="footer">
      👋&nbsp;
      <strong>
        Private use only. Do not forget to support your local artists 🙏❤️
      </strong>{" "}
      &nbsp;•&nbsp;Tidarr&nbsp;•&nbsp;
      <span>v{window._env_.REACT_APP_TIDARR_VERSION}</span>
      &nbsp;•&nbsp;
      {isUpdateAvailable ? (
        <Button
          size="small"
          sx={{ color: theme.palette.alert }}
          onClick={() => actions.toggleModal(true)}
          color="warning"
          startIcon={<Warning />}
        >
          <strong>Update available</strong>
        </Button>
      ) : (
        <Link onClick={() => actions.toggleModal(true)} component="button">
          <strong>Configuration</strong>
        </Link>
      )}
      &nbsp;
      <Link
        href={`https://github.com/${window._env_.REACT_APP_TIDARR_REPO_URL}`}
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
