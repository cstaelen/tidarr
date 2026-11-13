import { createContext, ReactNode, useContext } from "react";
import { TrackType } from "src/types";

/**
 * Exposes the list of tracks rendered by the enclosing track-list module
 * (playlist, album, mix, search results, ...) to the play buttons inside it,
 * so that pressing play starts continuous playback of the whole list.
 */

interface TrackListContextType {
  tracks: TrackType[];
}

const TrackListContext = createContext<TrackListContextType | null>(null);

export function TrackListProvider({
  tracks,
  children,
}: {
  tracks: TrackType[] | null | undefined;
  children: ReactNode;
}) {
  if (!tracks) return <>{children}</>;

  return (
    <TrackListContext.Provider value={{ tracks }}>
      {children}
    </TrackListContext.Provider>
  );
}

export function useTrackList() {
  return useContext(TrackListContext);
}
