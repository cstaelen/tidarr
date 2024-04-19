import styled from "@emotion/styled";
import {
  Box,
  Container,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { Search } from "./Search";
import AlbumIcon from "@mui/icons-material/Album";
import { useSearchProvider } from "../provider/SearchProvider";

export const HeaderSearch = () => {
  const { quality, actions, keywords } =
    useSearchProvider();

  return (
    <Header initialState={!keywords}>
      <Container maxWidth="lg">
        {!keywords && (
          <>
            <Title>
              <AlbumIcon />
              Tidarr
            </Title>
            <Intro>Unofficial Tidal© media downloader</Intro>
          </>
        )}
        <SearchWrapper
          initialState={!keywords}
          sx={{
            alignItems: "center",
            display: {
              xs: "block",
              md: "flex",
            },
          }}
        >
          <Box sx={{ flex: "1 1 0" }}>
            <Search />
          </Box>
          {!!keywords && (
            <Box
              sx={{
                flex: "0 0 auto",
                marginTop: 1,
                margin: {
                  xs: "0 0 0.5rem 0",
                  md: "0.5rem 0 0 0.5rem",
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
                <ToggleButton value="hi_res">Hi&nbsp;res</ToggleButton>
                <ToggleButton value="all">All</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          )}
        </SearchWrapper>
      </Container>
    </Header>
  );
};

const Header = styled.div<{ initialState: boolean }>`
  background-color: ${({ initialState }) =>
    initialState ? "#121212" : "#212121"};
  left: 0;
  padding: ${({ initialState }) => (initialState ? "25vh 0" : 0)};
  top: 0;
  text-align: center;
  width: 100%;
  transition: all 250ms ease-in;
  z-index: 1000;
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

const SearchWrapper = styled(Box)<{ initialState: boolean }>`
  margin: 0 auto;
  max-width: ${({ initialState }) => (initialState ? "40rem" : "none")};
  transition: all 300ms ease-out;
  width: 100%;
`;
