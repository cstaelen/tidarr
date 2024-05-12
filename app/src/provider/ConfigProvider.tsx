import React, { useContext, useState, ReactNode, useEffect } from "react";
import {
  ApiReturnType,
  ConfigParametersType,
  ConfigType,
  ReleaseGithubType,
} from "../types";
import { check } from "src/server/queryApi";

type ConfigContextType = {
  isUpdateAvailable: boolean;
  releaseData: undefined | ReleaseGithubType;
  tokenMissing: boolean;
  config: undefined | ConfigParametersType;
  apiError: ApiReturnType | undefined;
  isConfigModalOpen: boolean;
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
    checkForUpdates();
    checkAPI();
  }, []);

  const value = {
    isUpdateAvailable,
    releaseData,
    tokenMissing,
    config,
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
