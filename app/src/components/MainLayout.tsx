import { ReactNode, useEffect, useState } from "react";
import styled from "@emotion/styled";
import { AppBar } from "@mui/material";
import { SearchProvider } from "src/provider/SearchProvider";

import { useConfigProvider } from "../provider/ConfigProvider";
import { ProcessingProvider } from "../provider/ProcessingProvider";

import { DialogConfig } from "./Dialog/DialogConfig";
import { DialogNoAPI } from "./Dialog/DialogNoAPI";
import { DialogToken } from "./Dialog/DialogToken";
import { HeaderSearch } from "./Layout/HeaderSearch";
import { ProcessingList } from "./Processing/ProcessingList";
import { Footer } from "./Footer";

function MainLayout({ children }: { children: ReactNode }) {
  const [appLoaded, setAppLoaded] = useState(false);
  const {
    config,
    actions: { checkAPI, checkForUpdates },
  } = useConfigProvider();

  useEffect(() => {
    setAppLoaded(true);
    checkAPI();
  }, []);

  useEffect(() => {
    if (config) checkForUpdates();
  }, [config]);

  if (!appLoaded || !config) return null;

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-between">
        <div className="relative">
          <SearchProvider>
            <ProcessingProvider>
              <Content>
                <AppBar id="app-bar" position="sticky">
                  <HeaderSearch />
                </AppBar>
                {children}
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

export default MainLayout;

const Content = styled.div`
  margin: 0 0 3rem 0;
`;
