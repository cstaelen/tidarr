export type ApiReturnType = { error: boolean; message: string };

export type TrackType = {
  album: TrackAlbumType;
  artists: {
    id: string;
    name: string;
    picture: string;
    type: string;
  }[];
  duration: number;
  audioQuality: string;
  releaseDate: string;
  title: string;
  id: string;
  url: string;
};

export type TrackAlbumType = {
  id: string;
  cover: string;
  url: string;
  releaseDate: string;
  title: string;
};

export type ArtistType = {
  artistRoles: string[];
  artistTypes: string[];
  id: string;
  name: string;
  picture: string;
  url: string;
  popularity: number;
};

export type AlbumType = {
  artists: {
    id: string;
    name: string;
    picture: string;
    type: string;
  }[];
  cover: string;
  duration: number;
  audioQuality: string;
  numberOfTracks: number;
  releaseDate: string;
  title: string;
  type: string;
  id: string;
  popularity: number;
  url: string;
};

export type TidalResponseFormat<T> = {
  items: T[];
  limit?: number;
  offset?: number;
  totalNumberOfItems: number;
};

export type TidalResponseType = {
  albums: TidalResponseFormat<AlbumType>;
  tracks: TidalResponseFormat<TrackType>;
  artists: TidalResponseFormat<ArtistType>;
  playlists?: TidalResponseFormat<PlaylistType> | undefined;
};

export type ProcessingItemType = {
  id: string;
  artist: string;
  title: string;
  type: "artist" | "album" | "track" | "playlist";
  status: "queue" | "finished" | "beet" | "processing" | "error";
  url: string;
  loading: boolean;
  error: boolean;
  output: string;
};

export type TidalArtistResponseType = {
  id: string;
  rows: {
    modules: TidalArtistModuleType[];
  }[];
  selfLink: string;
  title: string;
};

export type TidalArtistAlbumsListType = {
  items: AlbumType[];
  totalNumberOfItems: number;
  limit: number;
  dataApiPath: string;
};

export type TidalArtistModuleType = {
  type: string;
  title: string;
  album: AlbumType;
  pagedList: TidalArtistAlbumsListType;
  showMore: {
    apiPath: string;
  };
};

export type PlaylistType = {
  uuid: string;
  title: string;
  numberOfTracks: number;
  numberOfVideos: number;
  creator: {
    id: number;
  };
  description: string;
  duration: number;
  lastUpdated: string;
  created: string;
  type: string;
  publicPlaylist: boolean;
  url: string;
  image: string;
  popularity: number;
  squareImage: string;
  promotedArtists: {
    id: number;
    name: string;
    type: string;
    picture: string;
  }[];

  lastItemAddedAt: string;
};

export type ConfigType = {
  noToken: boolean;
  output: string;
  parameters: ConfigParametersType;
};

export type ConfigParametersType = {
  api: { [key: string]: string };
  app: { [key: string]: string };
};

export type ReleaseGithubType = {
  name: string;
  tag_name: string;
  body: string;
};
