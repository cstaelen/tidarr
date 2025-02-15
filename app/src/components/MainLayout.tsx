import { ReactNode, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import styled from "@emotion/styled";
import { AppBar } from "@mui/material";

import { useConfigProvider } from "../provider/ConfigProvider";
import { ProcessingProvider } from "../provider/ProcessingProvider";
import { SearchProvider } from "../provider/SearchProvider";

import { DialogConfig } from "./Dialog/DialogConfig";
import { DialogNoAPI } from "./Dialog/DialogNoAPI";
import { DialogToken } from "./Dialog/DialogToken";
import { DialogUpdateMessage } from "./Dialog/DialogUpdateMessage";
import { ProcessingList } from "./Processing/ProcessingList";
import { HeaderSearch } from "./Search/HeaderSearch";
import { Footer } from "./Footer";

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

function MainLayout({ children }: { children: ReactNode }) {
  const [appLoaded, setAppLoaded] = useState(false);
  const {
    config,
    actions: { checkAPI, checkForUpdates },
  } = useConfigProvider();

  const [params] = useSearchParams();

  useEffect(() => {
    setAppLoaded(true);
    checkAPI();
  }, []);

  useEffect(() => {
    if (config) checkForUpdates();
  }, [config]);

  if (!appLoaded) return null;

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-between">
        <div className="relative">
          <SearchProvider>
            <ProcessingProvider>
              <Content>
                <AppBar
                  id="app-bar"
                  position="sticky"
                  style={!params.get("query") ? { boxShadow: "none" } : {}}
                >
                  <HeaderSearch />
                </AppBar>
                {children}
              </Content>
              <ProcessingList />
              <DialogToken />
              <DialogNoAPI />
              <DialogConfig />
              <DialogUpdateMessage />
            </ProcessingProvider>
          </SearchProvider>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default MainLayout;

const Content = styled.div`
  margin: 0 0 3rem 0;
`;
