import React, { ReactNode, useContext, useEffect, useState } from "react";

import { check } from "src/server/queryApi";

import {
  ApiReturnType,
  ConfigParametersType,
  ConfigType,
  ReleaseGithubType,
} from "../types";

type ConfigContextType = {
  isUpdateAvailable: boolean;
  releaseData: undefined | ReleaseGithubType;
  tokenMissing: boolean;
  config: undefined | ConfigParametersType;
  apiError: ApiReturnType | undefined;
  isConfigModalOpen: boolean;
  reactAppEnvVars: ConfigParametersType;
  actions: {
    toggleModal: (isOpen: boolean) => void;
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
  const [apiError, setApiError] = useState<ApiReturnType>();
  const [config, setConfig] = useState<ConfigParametersType>();

  const reactAppEnvVars = {
    REACT_APP_TIDAL_SEARCH_TOKEN:
      window._env_.REACT_APP_TIDAL_SEARCH_TOKEN || "",
    REACT_APP_TIDAL_COUNTRY_CODE:
      window._env_.REACT_APP_TIDAL_COUNTRY_CODE || "",
    REACT_APP_TIDARR_SEARCH_URL: window._env_.REACT_APP_TIDARR_SEARCH_URL || "",
    REACT_APP_TIDARR_VERSION: window._env_.REACT_APP_TIDARR_VERSION || "",
    REACT_APP_TIDARR_REPO_URL: window._env_.REACT_APP_TIDARR_REPO_URL || "",
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
    const output: ApiReturnType | ConfigType = await check();
    if ((output as ApiReturnType)?.error) {
      setApiError(output as ApiReturnType);
      return;
    }

    const data = output as ConfigType;
    setTokenMissing(data?.noToken);
    setConfig(data.parameters);
  };

  // Check Updates
  const checkForUpdates = async () => {
    if (window._env_.REACT_APP_TIDARR_VERSION) {
      try {
        const response = await fetch(
          `https://api.github.com/repos/${window._env_.REACT_APP_TIDARR_REPO_URL}/releases`,
        );
        const data = (await response.json()) as ReleaseGithubType[];
        const latestVersion = data[0].tag_name.substring(
          1,
          data[0].tag_name.length,
        );
        const currentVersion = window._env_.REACT_APP_TIDARR_VERSION.substring(
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

  useEffect(() => {
    checkAPI();
    checkForUpdates();
  }, []);

  const value = {
    isUpdateAvailable,
    releaseData,
    tokenMissing,
    config,
    reactAppEnvVars,
    apiError,
    isConfigModalOpen,
    actions: {
      toggleModal,
    },
  };

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
}

export const useConfigProvider = () => {
  return useContext(ConfigContext);
};
