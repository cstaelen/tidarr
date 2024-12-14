import React, { ReactNode, useContext, useState } from "react";

import {
  ConfigParametersType,
  ConfigType,
  LogType,
  ReleaseGithubType,
} from "../types";

import { useApiFetcher } from "./ApiFetcherProvider";

type ConfigContextType = {
  isUpdateAvailable: boolean;
  releaseData: undefined | ReleaseGithubType;
  tokenMissing: boolean;
  config: undefined | ConfigParametersType;
  isConfigModalOpen: boolean;
  reactAppEnvVars: ConfigParametersType;
  actions: {
    toggleModal: (isOpen: boolean) => void;
    checkAPI: () => void;
    getTidalToken: () => void;
    getTidalTokenLogs: () => Promise<LogType | undefined>;
    checkForUpdates: () => void;
    deleteTidalToken: () => void;
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
  const [config, setConfig] = useState<ConfigParametersType>();

  const {
    actions: { check, get_token, get_token_log, delete_token },
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
    if (process.env.CI) {
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
        if (!data?.[0]) return;
        const latestVersion = data[0].tag_name.substring(
          1,
          data[0].tag_name.length,
        );
        const currentVersion = config?.TIDARR_VERSION.substring(
          1,
          data[0].tag_name.length,
        );
        setIsUpdateAvailable(
          latestVersion !== currentVersion && latestVersion > currentVersion,
        );
        setReleaseData(data[0]);
      } catch (e) {
        console.log("fetch github issue", e);
      }
    }
  };

  // Run Tidal token process AP
  const getTidalToken = async () => {
    await get_token();
  };

  // Get Tidal authentication logs
  const getTidalTokenLogs = async (): Promise<LogType | undefined> => {
    return await get_token_log();
  };

  // Remove Tidal token
  const deleteTidalToken = async () => {
    await delete_token();
  };

  const value = {
    isUpdateAvailable,
    releaseData,
    tokenMissing,
    config,
    reactAppEnvVars,
    isConfigModalOpen,
    actions: {
      toggleModal,
      getTidalToken,
      getTidalTokenLogs,
      checkAPI,
      checkForUpdates,
      deleteTidalToken,
    },
  };

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
}

export const useConfigProvider = () => {
  return useContext(ConfigContext);
};
