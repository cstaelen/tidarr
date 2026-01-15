import React, { ReactNode, useContext, useEffect, useState } from "react";
import { LOCALSTORAGE_DISPLAY_MODE, TIDARR_REPO_URL } from "src/contants";

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
  changeLogData: string[];
  tokenMissing: boolean;
  quality: undefined | QualityType;
  display: DisplayType;
  config: undefined | ConfigParametersType;
  tiddlConfig: undefined | ConfigTiddleType;
  configErrors: undefined | string[];
  actions: {
    checkAPI: () => void;
    checkForUpdates: () => void;
    setQuality: (quality: QualityType) => void;
    setDisplay: (mode: DisplayType) => void;
    setConfigErrors: (errors: undefined | string[]) => void;
  };
};

const ConfigContext = React.createContext<ConfigContextType>(
  {} as ConfigContextType,
);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [tokenMissing, setTokenMissing] = useState(false);
  const [releaseData, setReleaseData] = useState<ReleaseGithubType>();
  const [changeLogData, setChangeLogData] = useState<string[]>([]);
  const [config, setConfig] = useState<ConfigParametersType>();
  const [tiddlConfig, setTiddlConfig] = useState<ConfigTiddleType>();
  const [configErrors, setConfigErrors] = useState<string[] | undefined>();

  const [quality, setQuality] = useState<QualityType>();

  const [display, setDisplay] = useState<DisplayType>(
    (localStorage.getItem(LOCALSTORAGE_DISPLAY_MODE) as DisplayType) || "small",
  );

  const {
    actions: { get_settings },
  } = useApiFetcher();

  // Check API
  const checkAPI = async () => {
    const output = await get_settings();
    const data = output as ConfigType;

    setTokenMissing(data?.noToken);
    setConfig(data?.parameters);
    setTiddlConfig(data?.tiddl_config);
    setConfigErrors(data?.configErrors);
    setQuality(data?.tiddl_config?.download?.track_quality);
  };

  // Check Updates
  const checkForUpdates = async () => {
    if (config?.TIDARR_VERSION) {
      try {
        const response = await fetch(
          `https://api.github.com/repos/${TIDARR_REPO_URL}/releases`,
        );

        const data = (await response?.json()) as ReleaseGithubType[];
        const filteredData = data.filter((release) => !release.prerelease);

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

        // Extract only the descriptions (body) from all releases
        const descriptions = filteredData
          .map((release) => release.body)
          .slice(0, 8);
        setChangeLogData(descriptions);
      } catch (e) {
        console.log("fetch github issue", e);
      }
    }
  };

  useEffect(() => {
    localStorage.setItem(LOCALSTORAGE_DISPLAY_MODE, display);
  }, [display]);

  const value = {
    isUpdateAvailable,
    releaseData,
    changeLogData,
    tokenMissing,
    config,
    quality,
    display,
    tiddlConfig,
    configErrors,
    actions: {
      checkAPI,
      checkForUpdates,
      setQuality,
      setDisplay,
      setConfigErrors,
    },
  };

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
}

export const useConfigProvider = () => {
  return useContext(ConfigContext);
};
