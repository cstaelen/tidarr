/**
 * TypeScript declaration file to extend Express types
 * Provides type safety for app.locals
 */

import { Response } from "express";

import { ProcessingStack } from "./processing/core/processing-manager";
import { configureServer } from "./services/config";
import { TiddlConfig } from "./types";

declare global {
  namespace Express {
    interface Application {
      locals: Locals & {
        processingStack: ReturnType<typeof ProcessingStack>;
        addOutputLog: (
          id: string,
          message: string,
          replaceLast?: boolean,
        ) => void;
        activeListConnections: Response[];
        activeItemOutputConnections: Map<string, Response[]>;
        config?: Awaited<ReturnType<typeof configureServer>>;
        tiddlConfig?: TiddlConfig;
      };
    }
  }
}

export {};
