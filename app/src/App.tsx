import { ThemeProvider } from "@emotion/react";
import { CssBaseline, createTheme } from "@mui/material";
import React, { useEffect, useState } from "react";
import { DialogNoAPI } from "./components/Dialog/DialogNoAPI";
import { DialogToken } from "./components/Dialog/DialogToken";
import { ProcessingList } from "./components/Processing/ProcessingList";
import { Results } from "./components/Results";
import {
  ProcessingProvider,
  useProcessingProvider,
} from "./provider/ProcessingProvider";
import { SearchProvider } from "./provider/SearchProvider";
import styled from "@emotion/styled";
import { GitHub } from "@mui/icons-material";

declare module "@mui/material/styles/createPalette" {
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

function App() {
  const { apiError } = useProcessingProvider();
  const [appLoaded, setAppLoaded] = useState(false);

  useEffect(() => apiError && console.log(apiError), [apiError]);
  useEffect(() => setAppLoaded(true), []);

  if (!appLoaded) return null;

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
        👋{" "}
        <strong>
          Private use only. Do not forget to support your local artists 🙏❤️
        </strong>{" "}
        • Tidarr • <span>v{window._env_.REACT_APP_TIDARR_VERSION}</span> •{" "}
        <a href="https://github.com/cstaelen/tidarr" target="_blank">
          <GitHub />
        </a>
      </Support>
    </ThemeProvider>
  );
}

export default App;

const Support = styled.div`
  background-color: rgb(144, 202, 249);
  color: #393939;
  font-weight: normal;
  padding: 0.3rem;
  position: fixed;
  text-align: center;
  bottom: 0;
  left: 0;
  line-height: 1;
  width: 100%;
  z-index: 1000;

  a {
    color: black;
    vertical-align: middle;
  }
`;

const Content = styled.div`
  margin: 0 0 3rem 0;
`;
