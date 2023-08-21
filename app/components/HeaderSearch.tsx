import styled from "@emotion/styled";
import { Container } from "@mui/material";
import { Search } from "./Search";
import AlbumIcon from '@mui/icons-material/Album';
import { useSearchProvider } from "../provider/SearchProvider";

export const HeaderSearch = () => {
  const { searchResults, loading } = useSearchProvider();

  return (
    <Header initialState={!loading && Object.keys(searchResults)?.length === 0}>
      <Container maxWidth="lg">
        {!loading && Object.keys(searchResults).length === 0 && (
          <>
            <Title><AlbumIcon />Tidarr</Title>
            <Intro>Unoffical Tidal© media downloader</Intro>
          </>
        )}
        <SearchWrapper initialState={!loading && Object.keys(searchResults)?.length === 0}>
          <Search />
        </SearchWrapper>
      </Container>
    </Header>
  );
}

const Header = styled.div<{ initialState: boolean }>`
  background-color: #212121;
  left: 0;
  padding: ${({ initialState }) => initialState ? "15vh 0" : 0};
  position: fixed;
  top: 0;
  text-align: center;
  width: 100%;
  transition: all 300ms ease-out;
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
  max-width: ${({ initialState }) => initialState ? "40rem" : "none"};
  transition: all 300ms ease-out;
`;