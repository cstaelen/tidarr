"use client";

import { Search } from "./components/Search";
import { TidalProvider } from "./provider/TidalProvider";
import { Results } from "./components/Results";
import Container from "@mui/material/Container";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import styled from "@emotion/styled";
import { ProcessingList } from "./components/ProcessingList";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import AlbumIcon from '@mui/icons-material/Album';

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

export default function Home() {
  const params = useSearchParams();

  useEffect(() => {
    window.onbeforeunload = function (event: BeforeUnloadEvent) {
      var message = 'If you confirm leaving, download progress informations will be lost. But downloads should continue.';

      event = event || window.event;
      event.preventDefault();
      event.cancelBubble = true;
      event.returnValue = message;
    }
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="relative">
          <TidalProvider>
            <Header initialState={!params.get('query')} >
              <Container maxWidth="lg">
                {!params.get('query') && (
                  <>
                    <Title><AlbumIcon />Tidarr</Title>
                    <Intro>Unoffical Tidal© media downloader</Intro>
                  </>
                )}
                <SearchWrapper initialState={!params.get('query')} >
                  <Search />
                </SearchWrapper>
              </Container>
            </Header>
            {params.get('query') && (
              <Content>
                <Container maxWidth="lg">
                  <Results />
                </Container>
              </Content>
            )}
            <ProcessingList />
          </TidalProvider>
        </div>
      </main>
      <Support>👋 Private use only. Do not forget to support your local artists 🙏❤️</Support>
    </ThemeProvider>
  );
}

const Support = styled.div`
  background-color: rgb(144, 202, 249);
  color: #393939;
  font-weight: bold;
  padding: 0.3rem;
  position: fixed;
  text-align: center;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
`;

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

const Content = styled.div`
  margin: 6.5rem 0;
`;
