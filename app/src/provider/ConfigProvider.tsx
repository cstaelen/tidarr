import React, { ReactNode, useContext, useEffect, useState } from "react";

import {
  ConfigParametersType,
  ConfigTiddleType,
  ConfigType,
  QualityType,
  ReleaseGithubType,
} from "../types";

import { useApiFetcher } from "./ApiFetcherProvider";

type DisplayType = "small" | "large";

type ConfigContextType = {
  isUpdateAvailable: boolean;
  releaseData: undefined | ReleaseGithubType;
  tokenMissing: boolean;
  quality: QualityType;
  display: DisplayType;
  config: undefined | ConfigParametersType;
  tiddlConfig: undefined | ConfigTiddleType;
  isConfigModalOpen: boolean;
  actions: {
    toggleModal: (isOpen: boolean) => void;
    checkAPI: () => void;
    checkForUpdates: () => void;
    setQuality: (quality: QualityType) => void;
    setDisplay: (mode: DisplayType) => void;
  };
};

export const LOCALSTORAGE_QUALITY_DOWNLOAD = "tidarr-quality-download";
export const LOCALSTORAGE_DISPLAY_MODE = "tidarr-display-mode";

const ConfigContext = React.createContext<ConfigContextType>(
  {} as ConfigContextType,
);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [tokenMissing, setTokenMissing] = useState(false);
  const [releaseData, setReleaseData] = useState<ReleaseGithubType>();
  const [config, setConfig] = useState<ConfigParametersType>();
  const [tiddlConfig, setTiddlConfig] = useState<ConfigTiddleType>();

  const [quality, setQuality] = useState<QualityType>(
    (localStorage.getItem(LOCALSTORAGE_QUALITY_DOWNLOAD) as QualityType) ||
      tiddlConfig?.download?.quality ||
      "high",
  );

  const [display, setDisplay] = useState<DisplayType>(
    (localStorage.getItem(LOCALSTORAGE_DISPLAY_MODE) as DisplayType) || "small",
  );

  const {
    actions: { check },
  } = useApiFetcher();

  // Open/close config modal
  const toggleModal = (isOpen: boolean) => {
    setIsConfigModalOpen(isOpen);
  };

  // Check API
  const checkAPI = async () => {
    if (import.meta.env.CI) {
      setTokenMissing(false);
      return;
    }
    const output = await check();
    const data = output as ConfigType;
    setTokenMissing(data?.noToken);
    setConfig(data?.parameters);
    setTiddlConfig(data?.tiddl_config);
  };

  // Check Updates
  const checkForUpdates = async () => {
    if (config?.TIDARR_VERSION) {
      try {
        const response = await fetch(
          `https://api.github.com/repos/${window._env_.REACT_APP_TIDARR_REPO_URL}/releases`,
        );

        const data = (await response?.json()) as ReleaseGithubType[];
        const filteredData = data.filter(
          (release) => (release.prerelease = true),
        );
        if (!filteredData?.[0]) return;
        const latestVersion = filteredData[0].tag_name.substring(
          1,
          filteredData[0].tag_name.length,
        );
        const currentVersion = config?.TIDARR_VERSION.substring(
          1,
          filteredData[0].tag_name.length,
        );
        setIsUpdateAvailable(
          latestVersion !== currentVersion && latestVersion > currentVersion,
        );
        setReleaseData(filteredData[0]);
      } catch (e) {
        console.log("fetch github issue", e);
      }
    }
  };

  useEffect(() => {
    localStorage.setItem(LOCALSTORAGE_DISPLAY_MODE, display);
  }, [display]);

  useEffect(() => {
    localStorage.setItem(LOCALSTORAGE_QUALITY_DOWNLOAD, quality);
  }, [quality]);

  const value = {
    isUpdateAvailable,
    releaseData,
    tokenMissing,
    config,
    quality,
    display,
    isConfigModalOpen,
    tiddlConfig,
    actions: {
      toggleModal,
      checkAPI,
      checkForUpdates,
      setQuality,
      setDisplay,
    },
  };

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
}

export const useConfigProvider = () => {
  return useContext(ConfigContext);
};
