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
  explicit: boolean;
  version: string;
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
  mixes?: { ARTIST_MIX: string } & { [key: string]: string }[];
};

// ALBUM

export type AlbumArtistType = {
  id: string;
  name: string;
  picture: string;
  type: string;
};

export type AlbumType = {
  artists: AlbumArtistType[];
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
  explicit: boolean;
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

export type FavoritesType = {
  id: string;
  title: string;
  url: string;
  quality: QualityType;
  type: ContentType;
  lastUpdate?: string;
};

export type TidalItemType =
  | AlbumType
  | TrackType
  | ArtistType
  | PlaylistType
  | MixType
  | VideoType
  | FavoritesType;

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
  type?: ModuleTypeKeys;
  title: string;
  album?: AlbumType;
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

export type ModuleItemLevelType<T> = {
  item: T;
  playlist: T;
};

export type ModuleTypeKeys =
  | "ALBUM_LIST"
  | "ALBUM_HEADER"
  | "ALBUM_ITEMS"
  | "VIDEO_LIST"
  | "TRACK_LIST"
  | "PLAYLIST_LIST"
  | "MIXED_TYPES_LIST"
  | "MIX_LIST"
  | "EDITORIAL"
  | "ARTIST_HEADER"
  | "ARTIST_LIST"
  | "USER_ALBUM_LIST"
  | "USER_ARTIST_LIST"
  | "USER_PLAYLIST_LIST"
  | "USER_TRACK_LIST";

// CONFIG

export type ConfigType = {
  noToken: boolean;
  output: string;
  parameters: ConfigParametersType;
  tiddl_config: ConfigTiddleType;
  configErrors?: string[];
};

export type ConfigParametersType = { [key: string]: string | undefined };

export type ConfigTiddleType = {
  enable_cache?: boolean;
  debug?: boolean;
  templates: {
    default?: string;
    track?: string;
    video?: string;
    album?: string;
    playlist?: string;
    mix?: string;
  };
  download: {
    track_quality?: QualityType;
    video_quality?: string; // "sd" | "hd" | "fhd"
    skip_existing?: boolean;
    download_path?: string;
    scan_path?: string;
    threads_count?: number;
    singles_filter?: string; // "none" | "only" | "include"
    videos_filter?: string; // "none" | "only" | "allow"
    update_mtime?: boolean;
    rewrite_metadata?: boolean;
  };
  metadata?: {
    enable?: boolean;
    embed_lyrics?: boolean;
    cover?: boolean;
  };
  cover?: {
    save?: boolean;
    size?: number;
    allowed?: string[];
    templates?: {
      track?: string;
      album?: string;
      playlist?: string;
    };
  };
  m3u?: {
    save?: boolean;
    allowed?: string[];
    templates?: {
      album?: string;
      playlist?: string;
      mix?: string;
    };
  };
  auth: {
    token: string;
    refresh_token: string;
    expires: number;
    user_id: string;
    country_code: string;
  };
};

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

export type QualityType = "low" | "normal" | "high" | "max";
export type ContentType =
  | "artist"
  | "album"
  | "track"
  | "playlist"
  | "video"
  | "favorite_albums"
  | "favorite_tracks"
  | "favorite_playlists"
  | "artist_videos"
  | "video"
  | "mix";

export type ProcessingItemType = {
  id: string;
  artist: string;
  title: string;
  quality: QualityType;
  type: ContentType;
  status: "queue" | "finished" | "beet" | "processing" | "error";
  url: string;
  loading: boolean;
  error: boolean;
};

export type ApiReturnType = {
  error: boolean;
  message: string;
  status?: number;
};

// SYNC LIST

export type SyncItemType = {
  id: string;
  title: string;
  url: string;
  quality: QualityType;
  artist?: string;
  lastUpdate?: string;
  type: ContentType;
};
