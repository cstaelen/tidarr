# Self-hosted Tidal Media Downloader Docker Image
Tidarr is a Docker image that provides a web interface to download up to **24-bit 192.0 kHz** media from Tidal (tracks, albums, playlists, music videos). Format on the fly with Beets, automatically update your Plex library, and push notifications with Gotify.

[![GitHub Stars](https://img.shields.io/github/stars/cstaelen/tidarr.svg?color=94398d&labelColor=555555&logoColor=ffffff&style=for-the-badge&logo=github)](https://github.com/cstaelen/tidarr)
[![GitHub Release](https://img.shields.io/github/release-date/cstaelen/tidarr?color=94398d&labelColor=555555&logoColor=ffffff&style=for-the-badge&logo=github)](https://github.com/cstaelen/tidarr/releases)
[![GitHub Release](https://img.shields.io/github/release/cstaelen/tidarr?color=94398d&labelColor=555555&logoColor=ffffff&style=for-the-badge&logo=github)](https://github.com/cstaelen/tidarr/releases)
![Dependabot](https://img.shields.io/badge/dependabot-active-brightgreen?logo=dependabot&style=for-the-badge)
![Playwright CI](https://img.shields.io/github/actions/workflow/status/cstaelen/tidarr/playwright.yml?label=Playwright%20CI&labelColor=555555&logoColor=ffffff&style=for-the-badge&logo=github)
![Docker build](https://img.shields.io/github/actions/workflow/status/cstaelen/tidarr/docker-push.yml?label=Docker%20build&labelColor=555555&logoColor=ffffff&style=for-the-badge&logo=github)
[![Docker Pulls](https://img.shields.io/docker/pulls/cstaelen/tidarr.svg?color=1d64ed&labelColor=1d8fed&logoColor=ffffff&style=for-the-badge&label=pulls&logo=docker)](https://hub.docker.com/r/cstaelen/tidarr)
![Docker image size](https://img.shields.io/docker/image-size/cstaelen/tidarr?style=for-the-badge)
<a href="https://www.buymeacoffee.com/clst" target="_blank" title="Buy Me A Coffee"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 28px !important;width: 110px !important;" ></a>

<img src="https://github.com/cstaelen/tidarr/blob/main/.github/screenshot.png?raw=true" />

## Table of Contents
- [Features](#features)
- [Getting Started](#getting-started)
- [Tidal authentication](#tidal-authentication)
- [Options](#options)
  - [Download options](#download-settings)
  - [PUID/PGID](#puid-pgid)
  - [Password protection](#password-protection)
- [Services](#services):
  - [Beets](#beets)
  - [Plex/Plexamp](#plex-update)
  - [Gotify](#gotify)
  - [Apprise Api](#apprise-api)
- [User requests](#user-requests)
- [Donate](#donate)
- [Develop](#develop)

## Disclaimer

- Need an official (shared ?) Tidal account
- For educational purposes and personal use only
- **Do not forget to support your local artists (merch, live, ...)** 🙏❤️

## Features

### Main
- Downloadable media : tracks, albums, playlists, mixes, music videos
- Max quality : FLAC, **24 bit 192.0 kHz** (if available)
- Tidal trends content
- User playlists, mixes, favorites 
- Search by keywords
- Search by url : artist url, album url, playlist url, track url, mix url
- Download covers
- Admin password

### Service integration

- **[Beets.io](https://beets.readthedocs.io/en/stable/)** - Tag releases 
- **[Gotify](https://gotify.net/)** - Push notifications 
- **[Apprise API](https://github.com/caronc/apprise-api)** - Push notifications
- **[Plex](https://www.plex.tv/)** - Library update

### Companion app

- Song recognition : [Shazarr project](https://github.com/cstaelen/shazarr) (Android) 

### Technicals

- Server-side download list processing
- UI built with **ReactJS** + **ExpressJS** API
- Self-hostable with **Docker** using a Linuxserver.io base image (uncompressed size: ~190 MB)
- Download Tidal content with [Tiddl (2.5.1)](https://github.com/oskvr37/tiddl/tree/v2.5.1)



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

(if no `tiddl.json` file provided) :

Authorize your device using the UI token dialog

**or**

```bash 
docker compose exec -it tidarr tiddl auth
docker compose exec tidarr cp -rf /root/tiddl.json /home/app/standalone/shared/tiddl.json
```

**or**

```bash 
docker exec -it tidarr tiddl auth
docker exec tidarr cp -rf /root/tiddl.json /home/app/standalone/shared/tiddl.json
```
## Options

### Download settings

-> You can set download options in `/your/docker/path/to/tidarr/config/tiddl.json`.

See default :

```json
{
    "template": {
        "track": "{artist} - {title}",
        "video": "{artist} - {title}",
        "album": "{album_artist}/{album}/{number:02d}. {title}",
        "playlist": "{playlist}/{playlist_number:02d}. {artist} - {title}"
    },
    "download": {
        // Default high (16bit 44.1khz), max available: master (24bit 192khz max)
        // https://github.com/oskvr37/tiddl?tab=readme-ov-file#download-quality
        "quality": "high",
        // Should not be changed (otherwise downloads will fail) /!\
        "path": "/home/app/standalone/download/incomplete",
        "threads": 4,
        // Include or not singles while downloading "all releases"
        "singles_filter": "none", // "none", "only", "include"
        // Allow video download
        "download_video": true
    },
    "cover": {
        "save": false,
        "size": 1280,
        "filename": "cover.jpg"
    },
    // Will be automatically filled by in-app authentication
    "auth": {
        "token": "",
        "refresh_token": "",
        "expires": 0,
        "user_id": "",
        "country_code": ""
    },
    "omit_cache": false
}
```

For template format update, please see [Tiddl formatting documentation](https://github.com/oskvr37/tiddl/wiki/Template-formatting)

### PUID PGID

```yaml
environment:
  - ...
  - PUID=1234
  - PGID=123
```

### Password protection

If not set, no password is required to access the app.

```yaml
 environment:
  - ...
  - ADMIN_PASSWORD=<string> # if not set, no password are required to access
```

## Services

### Beets

Add to your *docker-compose* file in `environment:` section :

```yaml
environment:
  - ...
  - ENABLE_BEETS=true
```   

Beets options in `</mounted/config/folder/>beets-config.yml`:

### Plex update

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

### Gotify

Add to your *docker-compose* file in `environment:` section :

```yaml
environment:
  - ...
  - ENABLE_GOTIFY=true
  - GOTIFY_URL=<url|ip:port>
  - GOTIFY_TOKEN=<gotify_app_token>
```

### Apprise API

Add to your *docker-compose* file in `environment:` section :

```yaml
environment:
  - ...
  - ENABLE_APPRISE_API=true
  - APPRISE_API_ENDPOINT=http://{apprise_api_url}:{port}/notify/{config_id}
  - APPRISE_API_TAG=tidarr # optional
```
If no tag is defined, default tag value will be "all".

## User requests
As I'am the only maintainer for now, user requested features can takes time.
1) Feel free to create an issue with `enhancement` or `bug` tag.
2) Be my guest, fork and dev !

## Donate

If you would like to support this project, please do not hesitate to make a donation. It contributes a lot to motivation, gives me the energy to continue maintaining the project and adding the features requested by the users :)

<a href="https://www.buymeacoffee.com/clst" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="40" width="160"></a>

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

## Resources

- https://github.com/oskvr37/tiddl
- https://github.com/yaronzz/Tidal-Media-Downloader
- https://github.com/hmelder/TIDAL/wiki/search
- https://github.com/RandomNinjaAtk/arr-scripts (Lidarr extended scripts)
