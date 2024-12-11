import { useEffect, useState } from "react";
import styled from "@emotion/styled";

import { DialogConfig } from "./components/Dialog/DialogConfig";
import { DialogNoAPI } from "./components/Dialog/DialogNoAPI";
import { DialogToken } from "./components/Dialog/DialogToken";
import { Footer } from "./components/Footer";
import { ProcessingList } from "./components/Processing/ProcessingList";
import { Results } from "./components/Results";
import { useConfigProvider } from "./provider/ConfigProvider";
import { ProcessingProvider } from "./provider/ProcessingProvider";
import { SearchProvider } from "./provider/SearchProvider";

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

function App() {
  const [appLoaded, setAppLoaded] = useState(false);
  const {
    actions: { checkAPI, checkForUpdates },
  } = useConfigProvider();

  useEffect(() => {
    if (!appLoaded) return;
    checkAPI();
    checkForUpdates();
  }, [appLoaded]);

  useEffect(() => {
    setAppLoaded(true);
  }, []);

  if (!appLoaded) return null;

  return (
    <>
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
    </>
  );
}

export default App;

const Content = styled.div`
  margin: 0 0 3rem 0;
`;
