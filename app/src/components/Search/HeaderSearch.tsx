import { useParams } from "react-router-dom";
import styled from "@emotion/styled";
import AlbumIcon from "@mui/icons-material/Album";
import { Box, Container, ToggleButton, ToggleButtonGroup } from "@mui/material";

import { useSearchProvider } from "../../provider/SearchProvider";
import DisplayButton from "../Buttons/displayButton";
import LogoutButton from "../Buttons/LogoutButton";
import SettingsButton from "../Buttons/SettingsButton";

import { SearchForm } from "./SearchForm";

export const HeaderSearch = () => {
  const { quality, actions, keywords } = useSearchProvider();
  const { id } = useParams();

  return (
    <Header isHome={!keywords && !id}>
      <Container maxWidth="lg">
        {!keywords && !id && (
          <>
            <Title>
              <AlbumIcon />
              Tidarr
            </Title>
            <Intro>Unofficial Tidal© media downloader</Intro>
          </>
        )}
        <SearchWrapper
          sx={{
            alignItems: "center",
            maxWidth: !keywords && !id ? "40rem" : "none",
            py: 1,
            display: {
              xs: "block",
              md: "flex",
            },
          }}
        >
          <Box flex="1 1 0">
            <SearchForm />
          </Box>
          {keywords || id ? (
            <Box flex="0 0 auto" display="flex" alignItems="center">
              <Box
                sx={{
                  flex: "1 1 0",
                  marginTop: 1,
                  margin: {
                    xs: "0 0 0.5rem 0",
                    md: "0 0 0 0.5rem",
                  },
                }}
              >
                <ToggleButtonGroup
                  color="primary"
                  value={quality || "all"}
                  fullWidth
                  size={window.innerWidth > 1024 ? "large" : "small"}
                  exclusive
                  onChange={(e, value) => actions.setQuality(value)}
                  aria-label="Platform"
                >
                  <ToggleButton value="lossless">Lossless</ToggleButton>
                  <ToggleButton value="high">High</ToggleButton>
                  <ToggleButton value="all">All</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              &nbsp;
              <Box flex="0 0 auto">
                <DisplayButton />
              </Box>
              <Box flex="0 0 auto">
                <SettingsButton />
              </Box>
              <Box flex="0 0 auto">
                <LogoutButton />
              </Box>
            </Box>
          ) : (
            <LogoutWrapper>
              <SettingsButton />
              &nbsp;
              <LogoutButton />
            </LogoutWrapper>
          )}
        </SearchWrapper>
      </Container>
    </Header>
  );
};

const Header = styled.div<{ isHome: boolean }>`
  background-color: ${({ isHome }) => (isHome ? "#121212" : "#212121")};
  left: 0;
  padding: ${({ isHome }) => (isHome ? "25vh 0" : 0)};
  top: 0;
  text-align: center;
  width: 100%;
  transition: all 250ms ease-in;
  z-index: 2000;
`;

const Title = styled.h1`
  color: rgb(144, 202, 249);
  text-align: center;
  text-transform: uppercase;

  svg {
    margin-right: 0.75rem;
    transform: scale(1.5);
  }
`;

const Intro = styled.p`
  text-align: center;
`;

const SearchWrapper = styled(Box)`
  margin: 0 auto;
  transition: all 300ms ease-out;
  width: 100%;
`;

const LogoutWrapper = styled.div`
  position: fixed;
  right: 1rem;
  top: 1rem;
`;
