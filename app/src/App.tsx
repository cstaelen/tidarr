import { ThemeProvider } from "@emotion/react";
import { CssBaseline, createTheme } from "@mui/material";
import React, { useEffect, useState } from "react";
import { DialogNoAPI } from "./components/Dialog/DialogNoAPI";
import styled from "@emotion/styled";
import { DialogToken } from "./components/Dialog/DialogToken";
import { ProcessingList } from "./components/Processing/ProcessingList";
import { Results } from "./components/Results";
import {
  ProcessingProvider,
  useProcessingProvider,
} from "./provider/ProcessingProvider";
import { SearchProvider } from "./provider/SearchProvider";
import { DialogConfig } from "./components/Dialog/DialogConfig";
import { ConfigProvider } from "./provider/ConfigProvider";
import { Footer } from "./components/Footer";

declare module "@mui/material/styles/createPalette" {
  interface Palette {
    gold: string;
    alert: string;
  }

  interface PaletteOptions {
    gold: string;
    alert: string;
  }
}

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    gold: "#a57c00",
    alert: "#e47964",
  },
});

function App() {
  const { apiError } = useProcessingProvider();
  const [appLoaded, setAppLoaded] = useState(false);

  useEffect(() => apiError && console.log(apiError), [apiError]);
  useEffect(() => setAppLoaded(true), []);

  if (!appLoaded) return null;

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <ConfigProvider>
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
                <DialogConfig />
              </ProcessingProvider>
            </SearchProvider>
          </div>
        </main>
        <Footer />
      </ConfigProvider>
    </ThemeProvider>
  );
}

export default App;

const Content = styled.div`
  margin: 0 0 3rem 0;
`;
