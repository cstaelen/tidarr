import { useCallback, useEffect, useRef, useState } from "react";
import { EventSourceController } from "event-source-plus";

import { useApiFetcher } from "../provider/ApiFetcherProvider";

export function useItemOutput(itemId: string | null) {
  const [output, setOutput] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const controllerRef = useRef<EventSourceController | null>(null);
  const { actions } = useApiFetcher();

  const connect = useCallback(() => {
    if (!itemId) return;

    // Close existing connection if any
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    // Use the internal streamExpressJS helper via a new action
    const { controller } = actions.stream_item_output(itemId, (data) => {
      if (data.id === itemId && data.output !== undefined) {
        setOutput(data.output);
        setIsConnected(true);
      }
    });

    controllerRef.current = controller;
  }, [itemId, actions]);

  const disconnect = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Cleanup on unmount or when itemId changes
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    output,
    isConnected,
    connect,
    disconnect,
  };
}
