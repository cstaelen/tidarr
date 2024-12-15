# Selfhosted Tidal media downloader docker image
Tidarr is a docker image which provides a web interface to download **24 bit 192.0 kHz** medias from Tidal (tracks/albums/playlists/music videos).
Format on the fly with Beets, Automatically update your Plex library, Push notification with Gotify.

[![GitHub Stars](https://img.shields.io/github/stars/cstaelen/tidarr.svg?color=94398d&labelColor=555555&logoColor=ffffff&style=for-the-badge&logo=github)](https://github.com/cstaelen/tidarr)
[![GitHub Release](https://img.shields.io/github/release-date/cstaelen/tidarr?color=94398d&labelColor=555555&logoColor=ffffff&style=for-the-badge&logo=github)](https://github.com/cstaelen/tidarr/releases)
[![GitHub Release](https://img.shields.io/github/release/cstaelen/tidarr?color=94398d&labelColor=555555&logoColor=ffffff&style=for-the-badge&logo=github)](https://github.com/cstaelen/tidarr/releases)
![Playwright CI](https://img.shields.io/github/actions/workflow/status/cstaelen/tidarr/playwright.yml?label=Playwright%20CI&labelColor=555555&logoColor=ffffff&style=for-the-badge&logo=github)
![Docker build](https://img.shields.io/github/actions/workflow/status/cstaelen/tidarr/docker-push.yml?label=Docker%20build&labelColor=555555&logoColor=ffffff&style=for-the-badge&logo=github)
[![Docker Pulls](https://img.shields.io/docker/pulls/cstaelen/tidarr.svg?color=1d64ed&labelColor=1d8fed&logoColor=ffffff&style=for-the-badge&label=pulls&logo=docker)](https://hub.docker.com/r/cstaelen/tidarr)
<a href="https://www.buymeacoffee.com/clst" target="_blank" title="Buy Me A Coffee"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 28px !important;width: 110px !important;" ></a>

<img src="https://github.com/cstaelen/tidarr/blob/main/.github/screenshot.png?raw=true" />

## Table of Contents
- [Features](#features)
- [Getting Started](#getting-started)
- [Tidal authentication](#tidal-authentication)
- [Options](#options)
  - [Tidal search options](#tidal-search-optional)
  - [Download options](#download-settings-optional)
  - [PUID/PGID](#puid-pgid-optional)
  - [Password protection](#password-protection-optional)
- [Services](#services):
  - [Beets](#beets-optional)
  - [Plex/Plexamp](#plex-update-optional)
  - [Gotify](#gotify-optional)
- [User requests](#user-requests)
- [Donate](#donate)
- [Develop](#develop)

## Features
- Search by keywords
- Search by url : artist url, album url, playlist url, track url, mix url
- Downloadable media : tracks, albums, playlists, videos
- Max quality : **24 bit 192.0 kHz** (if available)
- Admin password available
- Server side download list processing
- UI build with **React JS** + **Express JS** API
- Self-hostable using **Docker** with Linuxserver.io base image (uncompressed size: ~ 190 Mo)
- Download from **Tidal** with Tiddl (python)
- Tag import using **Beets.io** (python)
- Push notifications using **Gotify**
- **Plex** library update

### Companion
- Song recognition : [Shazarr project](https://github.com/cstaelen/shazarr) (Android) 

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
            - /any/folder/to/download/videos:/home/app/standalone/download/videos
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
		-v /any/folder/to/download/videos:/home/app/standalone/download/videos \
    cstaelen/tidarr:latest
```

## Tidal authentication

(if no `.tiddl_config.json` token file provided) :

```bash 
docker compose exec -it tidarr tiddl
```

**or**

```bash 
docker exec -it tidarr tiddl
```
## Options

### Tidal search (optional)

```yaml
 environment:
  - ...
  - REACT_APP_TIDAL_COUNTRY_CODE=<country-code>
  - REACT_APP_TIDAL_SEARCH_TOKEN=<search_token>
  - REACT_APP_TIDARR_DEFAULT_QUALITY_FILTER=<"lossless" | "high" | "all">
```
N.B. `<country-code>` should match your Tidal account country code.
You can check it using :
```bash
docker exec tidarr cat /root/.tiddl_config.json
```

How to get search token :
- https://github.com/lucaslg26/TidalAPI/issues/23


### Download settings (optional)

```yaml
 environment:
  - ...
  - TIDDL_FORMAT=<format> # default: {artist}/{album}/{title}
  - TIDDL_PLAYLIST_FORMAT=<format> # default: {playlist}/{playlist_number}-{artist}-{title}
  - TIDDL_QUALITY=<low|normal|high|master> # default: high (16bit 44.1khz), max available: master (24bit 192khz max)
  - TIDDL_FORCE_EXT=<flac|mp3|m4a> # default: unset, depending the track downloaded.
```

### PUID PGID (optional)

```yaml
environment:
  - ...
  - PUID=1234
  - PGID=123
```

### Password protection (optional)

If not set, no password is required to access the app.

```yaml
 environment:
  - ...
  - ADMIN_PASSWORD=<string> # if not set, no password are required to access
```

## Services

### Beets (optional)

Add to your *docker-compose* file in `environment:` section :

```yaml
environment:
  - ...
  - ENABLE_BEETS=true
```   

Beets options in `</mounted/config/folder/>beets-config.yml`:

### Plex update (optional)

Add to your *docker-compose* file in `environment:` section :

```yaml
environment:
  - ...
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

### Gotify (optional)

Add to your *docker-compose* file in `environment:` section :

```yaml
environment:
  - ...
  - ENABLE_GOTIFY=true
  - GOTIFY_URL=<url|ip:port>
  - GOTIFY_TOKEN=<gotify_app_token>
```

Doc: https://github.com/oskvr37/tiddl

## User requests
As I'am the only maintainer for now, user requested features can takes time.
1) Feel free to create an issue with `enhancement` tag.
2) Be my guest, fork and dev !

## Donate

If you would like to support this project, please do not hesitate to make a donation. It contributes a lot to motivation, gives me the energy to continue maintaining the project and adding the features requested by the users :)

<a href="https://www.buymeacoffee.com/clst" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## Develop
Want more features and/or contribute ? Be my guest, fork and dev <3

Check docker environment variables in `compose.yml` before running :

```bash
make dev
```

Run tests :

```bash
make testing-build
make testing-run
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Purposes

- Renovate old torrent dl media library with full FLAC
- Just for coding
- Just for fun

## Disclaimer

- Need an offical Tidal account
- Private use only
- **Do not forget to support your local artists** 🙏❤️

## Resources

- https://github.com/oskvr37/tiddl
- https://github.com/yaronzz/Tidal-Media-Downloader
- https://github.com/lucaslg26/TidalAPI
- https://github.com/RandomNinjaAtk/arr-scripts (Lidarr extended scripts)
