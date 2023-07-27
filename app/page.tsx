"use client";

import { Search } from "./components/Search";
import { TidalProvider } from "./provider/TidalProvider";
import { Results } from "./components/Results";
import Container from "@mui/material/Container";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import styled from "@emotion/styled";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

export default function Home() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="relative">
          <TidalProvider>
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
          </TidalProvider>
        </div>
      </main>
    </ThemeProvider>
  );
}

const Header = styled.div`
  background-color: #212121;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
`;

const Content = styled.div`
  margin-top: 6rem;
`;
