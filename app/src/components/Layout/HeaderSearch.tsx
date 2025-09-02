import { Link } from "react-router-dom";
import styled from "@emotion/styled";
import AlbumIcon from "@mui/icons-material/Album";
import {
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/material";
import { useAuth } from "src/provider/AuthProvider";
import { useConfigProvider } from "src/provider/ConfigProvider";

import DisplayButton from "../Buttons/displayButton";
import LogoutButton from "../Buttons/LogoutButton";
import SettingsButton from "../Buttons/SettingsButton";

import { SearchForm } from "./SearchForm";

export const HeaderSearch = () => {
  const { quality, actions } = useConfigProvider();
  const { isAuthActive } = useAuth();

  return (
    <Header>
      <Box>
        <SearchWrapper
          sx={{
            alignItems: "center",
            py: 1,
            px: 1,
            display: {
              xs: "block",
              md: "flex",
            },
          }}
        >
          <Stack flex="1 1 0" direction="row" alignItems="center">
            <Box flex="0 0 auto" px={2}>
              <Link to="/" style={{ textDecoration: "none" }}>
                <Title data-testid="logo">
                  <AlbumIcon />
                  <span>Tidarr</span>
                </Title>
              </Link>
            </Box>
            <Box flex="1 1 0">
              <SearchForm />
            </Box>
          </Stack>

          <Box
            flex="0 0 auto"
            display="flex"
            alignItems="center"
            sx={{
              margin: {
                xs: "0.5rem 0 0",
                md: "0 0 0 0.5rem",
              },
            }}
          >
            <Box
              sx={{
                flex: "1 1 0",
              }}
            >
              <ToggleButtonGroup
                color="primary"
                value={quality || "all"}
                fullWidth
                size={window.innerWidth > 1024 ? "large" : "small"}
                exclusive
                onChange={(_e, value) => actions.setQuality(value)}
                aria-label="Platform"
              >
                <Tooltip title="Download format: '.m4a' files, 96 kbps">
                  <ToggleButton value="low">Low</ToggleButton>
                </Tooltip>
                <Tooltip title="Download format: '.m4a' files, 320 kbps">
                  <ToggleButton value="normal">Normal</ToggleButton>
                </Tooltip>
                <Tooltip title="Download format: '.flac' files, 16-bit, 44.1 kHz">
                  <ToggleButton value="high">High</ToggleButton>
                </Tooltip>
                <Tooltip title="Download format: '.flac' files, Up to 24-bit, 192 kHz">
                  <ToggleButton value="master">Master</ToggleButton>
                </Tooltip>
              </ToggleButtonGroup>
            </Box>
            &nbsp;
            <Box flex="0 0 auto">
              <DisplayButton />
            </Box>
            <Box flex="0 0 auto">
              <SettingsButton />
            </Box>
            {isAuthActive && (
              <Box flex="0 0 auto">
                <LogoutButton />
              </Box>
            )}
          </Box>
        </SearchWrapper>
      </Box>
    </Header>
  );
};

const Header = styled.div`
  background-color: #212121;
  box-shadow: 0 0 10px #000;
  left: 0;
  top: 0;
  text-align: center;
  width: 100%;
  transition: all 250ms ease-in;
  z-index: 2000;
`;

const SearchWrapper = styled(Box)`
  margin: 0 auto;
  transition: all 300ms ease-out;
  width: 100%;
`;

const Title = styled.h1`
  align-items: center;
  color: rgb(144, 202, 249);
  display: flex;
  font-size: 1rem;
  text-align: center;
  text-transform: uppercase;
  transition: color 300ms ease;

  &:hover {
    color: #ce93d8;
  }

  @media screen and (max-width: 30rem) {
    font-size: 0.75rem;
  }

  span {
    animation: hideText 1s forwards 2s;
    display: inline-block;
    padding-left: 0.75rem;
    overflow: hidden;
    width: 5rem;
  }

  svg {
    transform: scale(1.5);
  }

  @keyframes hideText {
    to {
      opacity: 0;
      padding: 0px;
      width: 0px;
    }
  }
`;
