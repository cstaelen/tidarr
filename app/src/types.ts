import { ChildProcessWithoutNullStreams } from "child_process";

// TRACK

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
  allowStreaming: boolean;
};

export type TrackAlbumType = {
  id: string;
  cover: string;
  url: string;
  releaseDate: string;
  title: string;
};

// ARTIST

export type ArtistType = {
  artistRoles: string[];
  artistTypes: string[];
  id: string;
  name: string;
  picture: string;
  url: string;
  popularity: number;
};

// ALBUM

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

// VIDEO

export type VideoType = {
  id: string;
  title: string;
  volumeNumber: number;
  trackNumber: number;
  releaseDate: string;
  imagePath: null;
  imageId: string;
  duration: number;
  quality: string;
  streamReady: boolean;
  streamStartDate: string;
  allowStreaming: true;
  explicit: boolean;
  popularity: number;
  type: string;
  artists: [
    {
      id: string;
      name: string;
      type: string;
      picture: string;
    },
  ];
};

// MIX

export type MixType = {
  id: string;
  title: string;
  subTitle: string;
  url?: string;
  images: {
    SMALL: MixImageType;
    MEDIUM: MixImageType;
    LARGE: MixImageType;
  };
  sharingImages: null;
  mixType: "TRACK_MIX";
  mixNumber: null;
  master: boolean;
  detailImages: {
    SMALL: MixImageType;
    MEDIUM: MixImageType;
    LARGE: MixImageType;
  };
};

export type MixImageType = {
  width: number;
  height: number;
  url: string;
};

// PLAYLIST

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

// TIDAL FETCH

export type TidalResponseType = {
  albums: TidalPagedListType<AlbumType>;
  tracks: TidalPagedListType<TrackType>;
  artists: TidalPagedListType<ArtistType>;
  playlists: TidalPagedListType<PlaylistType>;
  videos: TidalPagedListType<VideoType>;
};

export type TidalModuleResponseType<T> = {
  id: string;
  rows: {
    modules: TidalModuleListType<T>[];
  }[];
  selfLink: string;
  title: string;
};

export type TidalModuleListType<T> = {
  type?: string;
  title: string;
  album: AlbumType;
  pagedList: TidalPagedListType<T>;
  mix?: MixType;
  artist?: ArtistType;
  showMore: {
    apiPath: string;
  };
};

export type TidalPagedListType<T> = {
  items: T[];
  totalNumberOfItems: number;
  limit?: number;
  offset?: number;
  dataApiPath?: string;
};

// CONFIG

export type ConfigType = {
  noToken: boolean;
  output: string;
  parameters: ConfigParametersType;
};

export type ConfigParametersType = { [key: string]: string | undefined };

export type ReleaseGithubType = {
  name: string;
  tag_name: string;
  body: string;
  prerelease: boolean;
};

// AUTH

export type AuthType = {
  accessGranted: boolean;
  token?: string;
};

export type CheckAuthType = {
  isAuthActive: boolean;
};

// TOKEN

export type LogType = {
  output: string;
  output_history: string[];
  link: string;
  process?: ChildProcessWithoutNullStreams;
  status?: "finished" | "error" | "auth" | undefined;
  loading?: boolean;
  error?: boolean;
};

// PROCESSING LIST

export type ProcessingItemType = {
  id: string;
  artist: string;
  title: string;
  type: "artist" | "album" | "track" | "playlist" | "video";
  status: "queue" | "finished" | "beet" | "processing" | "error";
  url: string;
  loading: boolean;
  error: boolean;
  output: string;
};

export type ApiReturnType = {
  error: boolean;
  message: string;
  status?: number;
};
