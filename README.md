# Selfhosted Tidal media downloader web client with docker

<img src="https://github.com/cstaelen/tidarr/blob/main/screenshot.png?raw=true" />

### Features
- Search by keywords
- Search by url : artist url, album url, playlist url
- Downloadable media : tracks, albums, playlists
- Server side download list processing
- UI build with **React JS** + **Express JS** API
- Self-hostable using **Docker** with Linuxserver.io base image (image size: < 300 Mo)
- Download from **Tidal** with Tidal Media Downloader (python)
- Tag import using **Beets.io** (python)
- Push notifications using **Gotify**
- Plex library update

### Companion
- Song recognition : [Shazarr project](https://github.com/cstaelen/docker-shazarr) (Android) 

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
            - /any/folder/to/tidarr/config:/home/app/standalone/shared
            - /any/folder/to/download/albums:/home/app/standalone/download/albums
            - /any/folder/to/download/tracks:/home/app/standalone/download/tracks
            - /any/folder/to/download/playlists:/home/app/standalone/download/playlists
        restart: 'unless-stopped'
```

**or**

```bash
docker run  \
		--rm \
		--name tidarr \
		-p 8484:8484 \
		-v /any/folder/to/tidarr/config/:/home/app/standalone/shared \
		-v /any/folder/to/download/albums:/home/app/standalone/download/albums \
		-v /any/folder/to/download/tracks:/home/app/standalone/download/tracks \
		-v /any/folder/to/download/playlists:/home/app/standalone/download/playlists \
    cstaelen/tidarr:latest
```

## Proceed to Tidal Authentication

(if no `.tidal-dl.token.json` token file provided) :

```bash 
docker compose exec -it tidarr tidal-dl
```

**or**

```bash 
docker exec -it tidarr tidal-dl
```

## Tidal DL configuration :

Tidal DL options in `.tidal-dl.json`:

```json
{
    "albumFolderFormat": "{ArtistName}/{AlbumYear} - {AlbumTitle}",
    "apiKeyIndex": 4,
    "audioQuality": "HiFi",
    "checkExist": true,
    "downloadDelay": true,
    // ⚠️ DO NOT MODIFY / DO NOT MOUNT - This folder is cleaned after each download 
    "downloadPath": "/home/app/standalone/download/incomplete",
    "includeEP": true,
    "language": 0,
    "lyricFile": false,
    "multiThread": false,
    "playlistFolderFormat": "{PlaylistName}",
    "saveAlbumInfo": false,
    "saveCovers": false,
    "showProgress": true,
    "showTrackInfo": true,
    "trackFileFormat": "{TrackNumber} - {TrackTitle}{ExplicitFlag}",
    "usePlaylistFolder": true,
    "videoFileFormat": "{VideoNumber} - {ArtistName} - {VideoTitle}{ExplicitFlag}",
    "videoQuality": "P360"
}
```

## BEETS

Add to your *docker-compose* file in `environment:` section :

```
- ENABLE_BEETS=true # optional
```   

Beets options in `</mounted/config/folder/>beets-config.yml`:

## PLEX UPDATE

Add to your *docker-compose* file in `environment:` section :

```
  - ENABLE_PLEX_UPDATE=true
  - PLEX_URL=<url|ip:port>
  - PLEX_LIBRARY=<music_library_id>
  - PLEX_TOKEN=<x-plex-token>
  - PLEX_PATH=/path/to/scan # optional - if not set, update whole library
```

- **PlexToken** : your Plex token : https://www.plexopedia.com/plex-media-server/general/plex-token/
- **Library ID** : In Plex server web ui, go to your music library tab and check `source=` in the URL
  http://192.168.1.20:32400/web/index.html#!/media/abcdef12345678/com.plexapp.plugins.library?**source=3**
- **Folder (optional)** : path to folder to scan url (if not set, all music library will be scanned)

Doc : https://www.plexopedia.com/plex-media-server/api/library/scan-partial/

## GOTIFY

Add to your *docker-compose* file in `environment:` section :

```
  - ENABLE_GOTIFY=true # optional
  - GOTIFY_URL=<url|ip:port>
  - GOTIFY_TOKEN=<gotify_app_token>
```

## OPTIONAL - Tidal search variables :

```
  - REACT_APP_TIDAL_SEARCH_TOKEN=<search_token> #optional
  - REACT_APP_TIDAL_COUNTRY_CODE=<country-code> #optional - useful to access restricted content
```
How to get search token :
- https://github.com/lucaslg26/TidalAPI/issues/23
- https://github.com/lucaslg26/TidalAPI

## Enhancements I'd love to add :

- [x] Use Shazam API to recognize songs, then search over Tidal and easily grab track or album.
=> See [Shazarr project here](https://github.com/cstaelen/docker-shazarr)
- [ ] Download Tidal playlist by URL

## Want more features and/or contribute ? Be my guest, fork and dev <3

Check docker environment variables in `compose.yml` before running :

```bash
make dev
```

Open [http://localhost:8484](http://localhost:8484) with your browser to see the result.

## Purposes

- Renovate old torrent dl media library with full FLAC
- Just for coding
- Just for fun

## Disclaimer

- Need an offical Tidal account
- Private use only
- **Do not forget to support your local artists** 🙏❤️

## Resources

- https://github.com/yaronzz/Tidal-Media-Downloader
- https://github.com/lucaslg26/TidalAPI
- https://github.com/RandomNinjaAtk/arr-scripts (Lidarr extended scripts)
