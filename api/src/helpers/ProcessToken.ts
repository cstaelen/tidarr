import { Express } from "express";

import { tidalToken } from "../services/tiddl";
import { LogType } from "../types";

export type ProcessTokenType = {
  data: LogType | object;
  actions: {
    getLogs: () => LogType | object;
    runTidalAuthentication: () => void;
    updateLog: (log: LogType) => void;
    stopTokenProcess: () => void;
  };
};

export const ProcessToken = (expressApp: Express): ProcessTokenType => {
  let data: LogType | object = {};

  function runTidalAuthentication(): void {
    stopTokenProcess();
    tidalToken(expressApp);
  }

  function updateLog(log: LogType) {
    data = log;
    return data;
  }

  function getLogs() {
    return data;
  }

  function stopTokenProcess() {
    const item = data as LogType;
    item?.process?.kill("SIGSTOP");
    item?.process?.kill("SIGTERM");
    item?.process?.kill("SIGKILL");
    item?.process?.stdin?.end();
    data = {};
  }

  return {
    data,
    actions: {
      getLogs,
      runTidalAuthentication,
      updateLog,
      stopTokenProcess,
    },
  };
};
