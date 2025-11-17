/**
 * TypeScript declaration file to extend Express types
 * Provides type safety for app.locals
 */

import { Response } from "express";

import { ProcessingStack } from "./processing/ProcessingStack";

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
        config?: unknown;
        tiddlConfig?: unknown;
      };
    }
  }
}

export {};
