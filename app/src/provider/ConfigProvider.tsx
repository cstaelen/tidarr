import React, { ReactNode, useContext, useEffect, useState } from "react";
import {
  LOCALSTORAGE_DISPLAY_MODE,
  LOCALSTORAGE_LAST_SEEN_VERSION,
  TIDARR_REPO_URL,
} from "src/contants";

import {
  ConfigParametersType,
  ConfigTiddleType,
  ConfigType,
  QualityType,
  ReleaseGithubType,
} from "../types";

import { useApiFetcher } from "./ApiFetcherProvider";

// Compare two version strings (e.g., "v1.1.3" vs "v1.1.7")
// Returns: -1 if a < b, 0 if a == b, 1 if a > b
function compareVersions(a: string, b: string): number {
  const parseVersion = (v: string) =>
    v
      .replace(/^v/, "")
      .split(".")
      .map((n) => parseInt(n, 10) || 0);

  const aParts = parseVersion(a);
  const bParts = parseVersion(b);
  const maxLen = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < maxLen; i++) {
    const aVal = aParts[i] || 0;
    const bVal = bParts[i] || 0;
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
  }
  return 0;
}

type DisplayType = "small" | "large";

type ConfigContextType = {
  isUpdateAvailable: boolean;
  releaseData: undefined | ReleaseGithubType;
  changeLogData: string[];
  unseenReleases: ReleaseGithubType[];
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
    markVersionAsSeen: () => void;
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
  const [unseenReleases, setUnseenReleases] = useState<ReleaseGithubType[]>([]);
  const [config, setConfig] = useState<ConfigParametersType>();
  const [tiddlConfig, setTiddlConfig] = useState<ConfigTiddleType>();
  const [configErrors, setConfigErrors] = useState<string[] | undefined>();

  const [quality, setQuality] = useState<QualityType>();

  const [display, setDisplay] = useState<DisplayType>(
    (localStorage.getItem(LOCALSTORAGE_DISPLAY_MODE) as DisplayType) || "small",
  );

  const markVersionAsSeen = () => {
    if (config?.TIDARR_VERSION) {
      localStorage.setItem(
        LOCALSTORAGE_LAST_SEEN_VERSION,
        config.TIDARR_VERSION,
      );
      setUnseenReleases([]);
    }
  };

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

        const currentVersion = config.TIDARR_VERSION;
        const latestVersion = filteredData[0].tag_name;

        // Check if update is available
        setIsUpdateAvailable(
          compareVersions(latestVersion, currentVersion) > 0,
        );
        setReleaseData(filteredData[0]);

        // Extract only the descriptions (body) from all releases
        const descriptions = filteredData
          .map((release) => release.body)
          .slice(0, 8);
        setChangeLogData(descriptions);

        // Calculate unseen releases for changelog modal
        const lastSeenVersion = localStorage.getItem(
          LOCALSTORAGE_LAST_SEEN_VERSION,
        );

        if (!lastSeenVersion) {
          // First visit: show only current version changelog
          const currentRelease = filteredData.find(
            (release) =>
              compareVersions(release.tag_name, currentVersion) === 0,
          );
          setUnseenReleases(currentRelease ? [currentRelease] : []);
        } else if (compareVersions(currentVersion, lastSeenVersion) > 0) {
          // Version upgraded: show changelogs between lastSeen and current
          const unseen = filteredData
            .filter((release) => {
              const releaseVersion = release.tag_name;
              return (
                compareVersions(releaseVersion, lastSeenVersion) > 0 &&
                compareVersions(releaseVersion, currentVersion) <= 0
              );
            })
            // Sort descending (newest first: 1.1.6 → 1.1.5 → 1.1.4)
            .sort((a, b) => compareVersions(b.tag_name, a.tag_name));
          setUnseenReleases(unseen);
        } else {
          // Same version or downgrade: no modal
          setUnseenReleases([]);
          // Update lastSeen in case of downgrade
          if (compareVersions(currentVersion, lastSeenVersion) < 0) {
            localStorage.setItem(
              LOCALSTORAGE_LAST_SEEN_VERSION,
              currentVersion,
            );
          }
        }
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
    unseenReleases,
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
      markVersionAsSeen,
    },
  };

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
}

export const useConfigProvider = () => {
  return useContext(ConfigContext);
};
