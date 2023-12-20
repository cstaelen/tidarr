export type ApiReturnType = { error: boolean; message: string };

export type TrackType = {
  album: TrackAlbumType;
  artists: {
    id: number;
    name: string;
    picture: string;
    type: string;
  }[];
  duration: number;
  audioQuality: string;
  releaseDate: string;
  title: string;
  id: number;
  url: string;
};

export type TrackAlbumType = {
  id: number;
  cover: string;
  url: string;
  releaseDate: string;
  title: string;
};

export type ArtistType = {
  artistRoles: string[];
  artistTypes: string[];
  id: number;
  name: string;
  picture: string;
  url: string;
  popularity: number;
};

export type AlbumType = {
  artists: {
    id: number;
    name: string;
    picture: string;
    type: string;
  }[],
  cover: string;
  duration: number;
  audioQuality: string;
  numberOfTracks: number;
  releaseDate: string;
  title: string;
  type: string;
  id: number;
  popularity: number;
  url: string;
}

export type TidalResponseFormat<T> = {
  items: T[];
  limit: number;
  offset: number;
  totalNumberOfItems: number;
};

export type TidalResponseType = {
  albums: TidalResponseFormat<AlbumType>;
  tracks: TidalResponseFormat<TrackType>;
  artists: TidalResponseFormat<ArtistType>;
};

export type ProcessingItemType = {
  id: number;
  artist: string;
  title: string;
  type: "artist" | "album" | "track";
  status: "queue" | "finished" | "beet" | "processing" | "error";
  url: string;
  loading: boolean;
  error: boolean;
  output: string;
};

export type TidalArtistResponseType = {
  id: string;
  rows: {
    modules: TidalArtistModuleType[]
  }[];
  selfLink: string;
  title: string;
};

export type TidalArtistModuleType = {
  type: string;
  title: string;
  album: AlbumType;
  pagedList: {
    items: AlbumType[];
  };
}
