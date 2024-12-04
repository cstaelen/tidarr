import { useEffect, useState } from "react";
import styled from "@emotion/styled";

import { DialogConfig } from "./components/Dialog/DialogConfig";
import { DialogNoAPI } from "./components/Dialog/DialogNoAPI";
import { DialogToken } from "./components/Dialog/DialogToken";
import { Footer } from "./components/Footer";
import { ProcessingList } from "./components/Processing/ProcessingList";
import { Results } from "./components/Results";
import { useAuth } from "./provider/AuthProvider";
import { ConfigProvider } from "./provider/ConfigProvider";
import {
  ProcessingProvider,
  useProcessingProvider,
} from "./provider/ProcessingProvider";
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
  const { apiError } = useProcessingProvider();
  const { isAuthActive } = useAuth();
  const [appLoaded, setAppLoaded] = useState(false);

  useEffect(() => apiError && console.log(apiError), [apiError]);
  useEffect(() => setAppLoaded(isAuthActive !== undefined), [isAuthActive]);

  if (!appLoaded) return null;

  return (
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
  );
}

export default App;

const Content = styled.div`
  margin: 0 0 3rem 0;
`;
