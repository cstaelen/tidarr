# Selfhosted Tidal media downloader web client
<img src="https://github.com/cstaelen/tidarr/blob/main/screenshot.png?raw=true" />

- UI build with **Next JS**
- Self-hostable using **Docker**
- Download from **Tidal** with Tidal Media Downloader (python)
- Tag import using **Beets.io** (python)

## Getting Started

Example docker-compose.yml : 
```yaml
services:
  tidarr:
    image: cstaelen/tidarr
    container_name: 'tidarr'
    ports:
      - 8484:8484
    volumes:
      - /any/folder/to/tidarr/config/.tidal-dl.token.json:/root/.tidal-dl.token.json
      - /any/folder/to/tidarr/config/.tidal-dl.json:/root/.tidal-dl.json
      - /any/folder/to/tidarr/config/beets-config.yml:/root/beets-config.yml
      - /download/albums:/home/app/standalone/download/albums
      - /download/tracks:/home/app/standalone/download/tracks
    restart: 'unless-stopped'
    environment:
      - ENABLE_BEETS=true
      - NEXT_PUBLIC_TIDAL_SEARCH_TOKEN=<search_token> #optional
      - NEXT_PUBLIC_TIDAL_COUNTRY_CODE=<country-code> #optional
```
## Proceed to Tidal Authentication : 
```bash 
docker-compose exec tidarr tidal-dl
```

## Tidal DL configuration : 
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

## OPTIONAL - How to get search token : 
- https://github.com/lucaslg26/TidalAPI/issues/23
- https://github.com/lucaslg26/TidalAPI

## Be my guest, fork and dev <3

```bash
make dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Disclaimer
- Need a offical Tidal account
- Private use only
- **Do not forget to support your local artists** 🙏❤️

## Resources
- https://github.com/yaronzz/Tidal-Media-Downloader
- https://github.com/lucaslg26/TidalAPI