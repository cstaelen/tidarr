import { Express } from "express";

import { tidalToken } from "../services/tiddl";
import { LogType } from "../types";

export const ProcessToken = (expressApp: Express) => {
  let data: LogType | object = {};

  async function runTidalAuthentication(): Promise<void> {
    const item = expressApp.settings.tokenLog;
    await item?.process?.kill("SIGSTOP");
    await item?.process?.kill("SIGTERM");
    await item?.process?.kill("SIGKILL");
    await item?.process?.stdin?.end();

    await tidalToken(expressApp);
  }

  function updateLog(log: LogType) {
    data = log;
    return data;
  }

  function getLogs() {
    return data;
  }

  return {
    data,
    actions: {
      getLogs,
      runTidalAuthentication,
      updateLog,
    },
  };
};
