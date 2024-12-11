import React, { ReactNode, useContext, useState } from "react";
import { check, get_token, get_token_log } from "src/server/queryApi";

import {
  ApiReturnType,
  ConfigParametersType,
  ConfigType,
  LogType,
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
    checkAPI: () => void;
    setApiError: (error: ApiReturnType | undefined) => void;
    getTidalToken: () => void;
    getTidalTokenLogs: () => Promise<LogType | null>;
    checkForUpdates: () => void;
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
    const output = await check();
    if ((output as ApiReturnType)?.error) {
      setApiError(output as ApiReturnType);
      return;
    }

    const data = output as ConfigType;
    setTokenMissing(data?.noToken);
    setConfig(data?.parameters);
  };

  // Check Updates
  const checkForUpdates = async () => {
    if (window._env_.REACT_APP_TIDARR_VERSION) {
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

  // Run Tidal token process AP
  const getTidalToken = async () => {
    try {
      await get_token();
    } catch (e: unknown) {
      setApiError(e as ApiReturnType);
    }
  };

  // Get Tidal authentication logs
  const getTidalTokenLogs = async (): Promise<LogType | null> => {
    const output = await get_token_log();
    if ((output as ApiReturnType)?.error) {
      setApiError(output as ApiReturnType);
      return null;
    }

    return output as LogType;
  };

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
      getTidalToken,
      getTidalTokenLogs,
      checkAPI,
      setApiError,
      checkForUpdates,
    },
  };

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
}

export const useConfigProvider = () => {
  return useContext(ConfigContext);
};
