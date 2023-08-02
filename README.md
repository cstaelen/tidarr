## Getting Started

Example docker-compose.yml : 
```yaml
services:
  tidarr:
    image: cstaelen/tidarr:0.0.1a
    container_name: 'tidarr'
    ports:
      - 3000:3000
    volumes:
      - /any/folder/to/tidarr/config/.tidal-dl.token.json:/root/.tidal-dl.token.json
      - /any/folder/to/tidarr/config/.tidal-dl.json:/root/.tidal-dl.json
      - /any/folder/to/music:/usr/tidarr/download
    restart: 'unless-stopped'
    environment:
      - NEXT_PUBLIC_TIDAL_SEARCH_TOKEN=<search_token>
      - NEXT_PUBLIC_TIDAL_COUNTRY_CODE=<country-code>
```

How to get search token : 
- https://github.com/lucaslg26/TidalAPI/issues/23
- https://github.com/lucaslg26/TidalAPI

Process Tidal Authentication : 
```bash 
docker-compose exec tidarr tidal-dl
```

Tidal Album options in `.tidal-dl.json`:
```json
{
    "albumFolderFormat": "{ArtistName}/{AlbumYear} - {AlbumTitle}",
    "apiKeyIndex": 4,
    "audioQuality": "HiFi",
    "checkExist": true,
    "downloadDelay": true,
    "downloadPath": "./download/",
    "includeEP": true,
    "language": 0,
    "lyricFile": false,
    "multiThread": false,
    "playlistFolderFormat": "Playlist/{PlaylistName} [{PlaylistUUID}]",
    "saveAlbumInfo": false,
    "saveCovers": true,
    "showProgress": true,
    "showTrackInfo": true,
    "trackFileFormat": "{TrackNumber} - {TrackTitle}{ExplicitFlag}",
    "usePlaylistFolder": true,
    "videoFileFormat": "{VideoNumber} - {ArtistName} - {VideoTitle}{ExplicitFlag}",
    "videoQuality": "P360"
}
```


First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Resources
- https://github.com/yaronzz/Tidal-Media-Downloader
- https://github.com/lucaslg26/TidalAPI