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

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

export default function Home() {
  useEffect(() => {
    window.onbeforeunload = function(event: any) {
      var message = 'If you confirm leaving, download progress informations will be lost. But downloads should continue.';
      
      event = event || window.event;
      event.preventDefault = true;
      event.cancelBubble = true;
      event.returnValue = message;
    }
  }, [])
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="relative">
          <TidalProvider>
            <PreHeader>👋 Do not forget to support your local artists 🙏❤️</PreHeader>
            <Header>
              <Container maxWidth="lg">
                <Search />
              </Container>
            </Header>
            <Content>
              <Container maxWidth="lg">
                <Results />
              </Container>
            </Content>
            <ProcessingList />
          </TidalProvider>
        </div>
      </main>
    </ThemeProvider>
  );
}

const PreHeader = styled.div`
  background-color: #6dd3ff;
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

const Header = styled.div`
  background-color: #212121;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
`;

const Content = styled.div`
  margin-top: 8rem;
`;
