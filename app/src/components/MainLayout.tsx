import { ReactNode, useEffect, useState } from "react";
import styled from "@emotion/styled";
import AlbumIcon from "@mui/icons-material/Album";
import { AppBar, CircularProgress } from "@mui/material";
import { SearchProvider } from "src/provider/SearchProvider";

import { useConfigProvider } from "../provider/ConfigProvider";
import { ProcessingProvider } from "../provider/ProcessingProvider";

import { DialogConfig } from "./Dialog/DialogConfig";
import { DialogNoAPI } from "./Dialog/DialogNoAPI";
import { DialogToken } from "./Dialog/DialogToken";
import { Footer } from "./Layout/Footer";
import { HeaderSearch } from "./Layout/HeaderSearch";
import { ProcessingList } from "./Processing/ProcessingList";

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

  return (
    <>
      <main
        className="flex min-h-screen flex-col items-center justify-between"
        style={{ paddingBottom: "1rem" }}
      >
        <SearchProvider>
          <ProcessingProvider>
            <Content>
              <AppBar id="app-bar" position="sticky">
                <HeaderSearch />
              </AppBar>
              {!appLoaded || !config ? (
                <Loader>
                  <Title>
                    <AlbumIcon />
                    Tidarr
                  </Title>
                  <CircularProgress />
                </Loader>
              ) : (
                children
              )}
            </Content>
            <ProcessingList />
            <DialogToken />
            <DialogNoAPI />
            <DialogConfig />
          </ProcessingProvider>
        </SearchProvider>
      </main>
      <Footer />
    </>
  );
}

export default MainLayout;

const Content = styled.div`
  margin: 0 0 3rem 0;
`;

const Loader = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
`;

const Title = styled.div`
  align-items: center;
  color: rgb(144, 202, 249);
  display: flex;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-transform: uppercase;

  svg {
    margin-right: 0.5rem;
    transform: scale(1.2);
  }
`;
