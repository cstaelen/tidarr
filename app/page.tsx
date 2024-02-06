"use client";

import { Results } from "./components/Results";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import styled from "@emotion/styled";
import { ProcessingList } from "./components/Processing/ProcessingList";
import { SearchProvider } from "./provider/SearchProvider";
import { useEffect, useState } from "react";
import {
  ProcessingProvider,
  useProcessingProvider,
} from "./provider/ProcessingProvider";
import { DialogToken } from "./components/Dialog/DialogToken";
import { DialogNoAPI } from "./components/Dialog/DialogNoAPI";

declare module '@mui/material/styles/createPalette' {
  interface Palette {
      gold: string;
  }

  interface PaletteOptions {
      gold: string;
  }
}

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    gold: "#a57c00",
  },
});



export default function Home() {
  const { apiError } = useProcessingProvider();
  const [appLoaded, setAppLoaded] = useState(false);

  useEffect(() => apiError && console.log(apiError), [apiError]);
  useEffect(() => setAppLoaded(true), []);

  if (!appLoaded) return;

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <main className="flex min-h-screen flex-col items-center justify-between">
        <div className="relative">
          <SearchProvider>
            <ProcessingProvider>
              <Content>
                <Results />
              </Content>
              <ProcessingList />
              <DialogToken />
              <DialogNoAPI />
            </ProcessingProvider>
          </SearchProvider>
        </div>
      </main>
      <Support>
        👋 Private use only. Do not forget to support your local artists 🙏❤️
      </Support>
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
  margin: 0 0 3rem 0;
`;
