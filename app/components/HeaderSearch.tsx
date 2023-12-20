import styled from "@emotion/styled";
import { Container } from "@mui/material";
import { Search } from "./Search";
import AlbumIcon from "@mui/icons-material/Album";
import { useSearchProvider } from "../provider/SearchProvider";
import { useMemo } from "react";

export const HeaderSearch = () => {
  const { searchResults, artistResults, loading } = useSearchProvider();
  const hasNoResult = useMemo(() => {
    return (
      !loading &&
      Object.keys(searchResults)?.length === 0 &&
      artistResults?.length === 0
    );
  }, [searchResults, artistResults, loading]);

  return (
    <Header initialState={hasNoResult}>
      <Container maxWidth="lg">
        {hasNoResult && (
          <>
            <Title>
              <AlbumIcon />
              Tidarr
            </Title>
            <Intro>Unofficial Tidal© media downloader</Intro>
          </>
        )}
        <SearchWrapper initialState={hasNoResult}>
          <Search />
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

const SearchWrapper = styled.div<{ initialState: boolean }>`
  margin: 0 auto;
  max-width: ${({ initialState }) => (initialState ? "40rem" : "none")};
  transition: all 300ms ease-out;
`;
