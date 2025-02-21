import React, { ReactNode, useContext, useState } from "react";

import { ConfigParametersType, ConfigType, ReleaseGithubType } from "../types";

import { useApiFetcher } from "./ApiFetcherProvider";

type ConfigContextType = {
  isUpdateAvailable: boolean;
  releaseData: undefined | ReleaseGithubType;
  tokenMissing: boolean;
  config: undefined | ConfigParametersType;
  isConfigModalOpen: boolean;
  reactAppEnvVars: ConfigParametersType;
  showUpdateMessage: boolean;
  actions: {
    toggleModal: (isOpen: boolean) => void;
    checkAPI: () => void;
    checkForUpdates: () => void;
    setShowUpdateMessage: (show: boolean) => void;
  };
};

const ConfigContext = React.createContext<ConfigContextType>(
  {} as ConfigContextType,
);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [tokenMissing, setTokenMissing] = useState(false);
  const [releaseData, setReleaseData] = useState<ReleaseGithubType>();
  const [showUpdateMessage, setShowUpdateMessage] = useState<boolean>(false);
  const [config, setConfig] = useState<ConfigParametersType>();

  const {
    actions: { check },
  } = useApiFetcher();

  const reactAppEnvVars = {
    REACT_APP_TIDAL_SEARCH_TOKEN:
      window._env_.REACT_APP_TIDAL_SEARCH_TOKEN || "",
    REACT_APP_TIDAL_COUNTRY_CODE:
      window._env_.REACT_APP_TIDAL_COUNTRY_CODE || "",
    REACT_APP_TIDARR_SEARCH_URL: window._env_.REACT_APP_TIDARR_SEARCH_URL || "",
    REACT_APP_TIDARR_DEFAULT_QUALITY_FILTER:
      window._env_.REACT_APP_TIDARR_DEFAULT_QUALITY_FILTER || "",
  };

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

  const value = {
    isUpdateAvailable,
    releaseData,
    tokenMissing,
    config,
    reactAppEnvVars,
    isConfigModalOpen,
    showUpdateMessage,
    actions: {
      toggleModal,
      checkAPI,
      checkForUpdates,
      setShowUpdateMessage,
    },
  };

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
}

export const useConfigProvider = () => {
  return useContext(ConfigContext);
};
