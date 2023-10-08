"use client";

import { Results } from "./components/Results";
import Container from "@mui/material/Container";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import styled from "@emotion/styled";
import { ProcessingList } from "./components/Processing/ProcessingList";
import { SearchProvider } from "./provider/SearchProvider";
import { HeaderSearch } from "./components/HeaderSearch";
import { useEffect, useState } from "react";
import { ProcessingProvider, useProcessingProvider } from "./provider/ProcessingProvider";
import { DialogToken } from "./components/Dialog/DialogToken";
import { DialogNoAPI } from "./components/Dialog/DialogNoAPI";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

export default function Home() {
  const { noAPI, tokenMissing } = useProcessingProvider();
  const [appLoaded, setAppLoaded] = useState(false);

  useEffect(() => setAppLoaded(true), []);

  if(!appLoaded) return;

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="relative">
          <SearchProvider>
            <ProcessingProvider>
              <HeaderSearch />
              <Content>
                <Container maxWidth="lg">
                  <Results />
                </Container>
              </Content>
              <ProcessingList />
            </ProcessingProvider>
          </SearchProvider>
        </div>
      </main>
      <Support>👋 Private use only. Do not forget to support your local artists 🙏❤️</Support>
      {tokenMissing && <DialogToken />}
      {noAPI && <DialogNoAPI />}
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

const Content = styled.div`
  margin: 6.5rem 0;
`;
