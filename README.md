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

<img src="https://github.com/cstaelen/tidarr/blob/main/.github/tidarr-demo.gif?raw=true" />

## Table of Contents
- [Features](#features)
- [Getting Started](#getting-started)
- [Tidal authentication](#tidal-authentication)
- [Options](#options)
  - [Download settings](#download-settings)
  - [PUID/PGID/UMASK](#puid-pgid-umask)
  - [Password protection](#password-protection)
  - [Lock quality selector](#lock-quality-selector)
  - [Proxy](#proxy)
  - [M3U track base path](#m3u-track-base-path)
  - [Sync playlists and mixes](#sync-playlists-and-mixes)
  - [Custom CSS](#custom-css)
- [Services](#services):
  - [Beets](#beets)
  - [Plex/Plexamp](#plex-update)
  - [Gotify](#gotify)
  - [Apprise Api](#apprise-api)
  - [Webhook push over](#webhook-push-over)
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
- M3U file for playlist with customizable path
- Watch and sync playlists, mixes, favorites and artists with cron
- Skip download if track exists
- Custom CSS

### Service integration

- **[Beets.io](https://beets.readthedocs.io/en/stable/)** - Tag releases 
- **[Gotify](https://gotify.net/)** - Push notifications 
- **[Apprise API](https://github.com/caronc/apprise-api)** - Push notifications
- **Webhook push over** - Push notifications using webhook (MatterMost)
- **[Plex](https://www.plex.tv/)** - Library update

### Companion app

- Song recognition : [Shazarr project](https://github.com/cstaelen/shazarr) (Android) 

### Technicals

- Server-side download list processing
- UI built with **ReactJS** + **ExpressJS** API
- Self-hostable with **Docker** using a Linuxserver.io base image (uncompressed size: ~190 MB)
- Download Tidal content with [Tiddl (2.6.4)](https://github.com/oskvr37/tiddl/tree/v2.6.4)


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
            - /any/folder/to/library:/home/app/standalone/library
        restart: 'unless-stopped'
```

**or**

```bash
docker run  \
		--rm \
		--name tidarr \
		-p 8484:8484 \
		-v /any/folder/to/tidarr/config:/home/app/standalone/shared \
		-v /any/folder/to/library:/home/app/standalone/library \
    cstaelen/tidarr:latest
```

## Tidal authentication

(if no `tiddl.json` file provided) :

Authorize your device using the UI token dialog

**or**

```bash 
docker compose exec -it -e TIDDL_PATH=/home/app/standalone/shared tidarr tiddl auth login
```

**or**

```bash 
docker exec -it -e TIDDL_PATH=/home/app/standalone/shared tidarr tiddl auth
```

## Options

### Download settings

-> You can set download options in `/your/docker/path/to/tidarr/config/tiddl.json`.

/!\ Be ware to set the right folder templates

See default :

```json
{
  // More tiddl details : https://github.com/oskvr37/tiddl/wiki/Template-formatting
    "template": {
      "album": "{album_artist}/{album}/{number:02d}. {title}",
        "track": "{artist}/_tracks/{artist} - {title}",
        "video": "_videos/{artist}/{artist} - {title}",
        "playlist": "_playlists/{playlist}/{playlist_number:02d}. {artist} - {title}"
    },
    "download": {
      // Default high (16bit 44.1khz), max available: master (24bit 192khz max)
        // https://github.com/oskvr37/tiddl?tab=readme-ov-file#download-quality
        "quality": "high",
        // Should not be changed (otherwise downloads will fail) /!\
        "path": "/home/app/standalone/download/incomplete",
        // `scan_path` is used to skip existing files. Set it to null if you want to override. 
        "scan_path": "/home/app/standalone/library",
        "threads": 4,
        "embed_lyrics": false,
        // Include or not singles while downloading "all releases"
        "singles_filter": "none", // "none", "only", "include"
        // Show video content
        "download_video": true,
        // Add playlist file
        "save_playlist_m3u": true
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

### PUID PGID UMASK

```yaml
environment:
  - ...
  - PUID=1234
  - PGID=123
  - UMASK=0022
```

### Password protection

If not set, no password is required to access the app.

```yaml
 environment:
  - ...
  - ADMIN_PASSWORD=<string> # if not set, no password are required to access
```

### Lock quality selector

Force use of `tiddl.json` quality value and disable quality selector in app

```yaml
 environment:
  - ...
  - LOCK_QUALITY=true
```

### Proxy

You may want to use proxy for tidal server queries to enhance privacy.

```yaml
 environment:
  - ...
  - ENABLE_TIDAL_PROXY=true
```

### M3U track base path 

Default base path used in `.m3u` : `./`
You can custom base path used by track path in `.m3u` file :  

```yaml
 environment:
  - ...
  - M3U_BASEPATH_FILE="../../"
```

### Sync playlists and mixes

Default value is daily sync at **3 am** (`0 3 * * *`).
You can set a custom cron expression using `SYNC_CRON_EXPRESSION` env var.

To run task at midnight (00:00) every Monday :

```yaml
environment:
  - ...
  - SYNC_CRON_EXPRESSION="0 0 * * 1"
```

**\* Syntaxe :**
- Minute (0 - 59)
- Hour (0 - 23)
- Day of the month (1 - 31)
- Month (1 - 12)
- Day of the week (0 - 7) (Sunday is both 0 and 7)

### Custom CSS

You can customize Tidarr's appearance using the UI in settings dialog, or by editing the `custom.css` file. This file is automatically created in your config folder on first launch.

**File location**: `/your/docker/path/to/tidarr/config/custom.css`



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

### Webhook push over

Many push over services can be used as an URL to curl with a payload.
Exemple with MatterMost :

```bash
curl -i -X POST -H 'Content-Type: application/json' -d '{"text": "Hello, this is some text\nThis is more text. 🎉"}' https://your-mattermost-server.com/hooks/xxx-generatedkey-xxx
```
You can set URL in Tidarr env vars

```yaml
environment:
  - ...
  - PUSH_OVER_URL=https://your-mattermost-server.com/hooks/xxx-generatedkey-xxx
```

It should also works with other services using the same payload format `{"text": "..."}`.


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

### Multi-platform Docker builds

The `docker-build` Makefile target now relies on [Docker Buildx](https://docs.docker.com/build/buildx/) so you can produce images for several architectures in one command.

- Build a local image for your host (default `linux/amd64`):

```bash
make docker-build IMAGE_TAG=dev BUILD_VERSION=0.0.0-dev
```

- Build and push a multi-platform image (examples: `linux/amd64` and `linux/arm64`):

```bash
make docker-build PLATFORMS=linux/amd64,linux/arm64 IMAGE_TAG=latest BUILD_VERSION=1.2.3
```

When multiple platforms are requested the target automatically pushes the image, so ensure you are logged in to the registry that matches the `IMAGE` value.

To run a specific platform locally, override `RUN_PLATFORM` when using `make docker-run`:

```bash
make docker-run RUN_PLATFORM=linux/arm64 IMAGE_TAG=latest
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
