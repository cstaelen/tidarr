# Self-hosted Tidal Media Downloader Docker Image
Tidarr is a Docker image that provides a web interface to download up to **24-bit 192.0 kHz** media (tracks, albums, playlists, music videos) from Tidal using Tiddl python binary. Format on the fly with Beets, automatically update your Plex library, and push notifications.

[![GitHub Stars](https://img.shields.io/github/stars/cstaelen/tidarr.svg?color=94398d&labelColor=555555&logoColor=ffffff&style=for-the-badge&logo=github)](https://github.com/cstaelen/tidarr)
[![GitHub Release](https://img.shields.io/github/release-date/cstaelen/tidarr?color=94398d&labelColor=555555&logoColor=ffffff&style=for-the-badge&logo=github)](https://github.com/cstaelen/tidarr/releases)
[![GitHub Release](https://img.shields.io/github/release/cstaelen/tidarr?color=94398d&labelColor=555555&logoColor=ffffff&style=for-the-badge&logo=github)](https://github.com/cstaelen/tidarr/releases)
![Dependabot](https://img.shields.io/badge/dependabot-active-brightgreen?logo=dependabot&style=for-the-badge)
![Playwright CI](https://img.shields.io/github/actions/workflow/status/cstaelen/tidarr/playwright.yml?label=Playwright%20CI&labelColor=555555&logoColor=ffffff&style=for-the-badge&logo=github)
![Docker build](https://img.shields.io/github/actions/workflow/status/cstaelen/tidarr/docker-push.yml?label=Docker%20build&labelColor=555555&logoColor=ffffff&style=for-the-badge&logo=github)
[![Docker Pulls](https://img.shields.io/docker/pulls/cstaelen/tidarr.svg?color=1d64ed&labelColor=1d8fed&logoColor=ffffff&style=for-the-badge&label=pulls&logo=docker)](https://hub.docker.com/r/cstaelen/tidarr)
![Docker image size](https://img.shields.io/docker/image-size/cstaelen/tidarr?style=for-the-badge)
<a href="https://www.buymeacoffee.com/clst" target="_blank" title="Buy Me A Coffee"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="28" style="height: 28px !important;width: 110px !important;" ></a>

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
  - [Download History](#download-history)
- [Services](#services):
  - [Beets](#beets)
  - [Plex/Plexamp](#plex-integration)
  - [Jellyfin](#jellyfin-integration)
  - [Navidrome search](#navidrome-search)
  - [Gotify](#gotify)
  - [Ntfy](#ntfy)
  - [Apprise Api](#apprise-api)
  - [Webhook push over](#webhook-push-over)
- [Advanced](#advanced)
  - [Custom Processing Script](#custom-processing-script)
  - [No-download flag](#no-download)
  - [API Documentation](#api-documentation)
- [User requests](#user-requests)
- [Donate](#donate)
- [Develop](#develop)

> [!WARNING]
> **Disclaimer**
>
> - Need an official (shared ?) Tidal account
> - For educational purposes and personal use only
> - **Do not forget to support your local artists (merch, live, ...)** 🙏❤️

## FEATURES

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
- Docker platforms:`linux/amd64` and `linux/arm64`

### Service integration

- **[Beets.io](https://beets.readthedocs.io/en/stable/)** - Tag releases 
- **[Gotify](https://gotify.net/)** - Push notifications
- **[Ntfy](https://ntfy.sh)** - Push notifications
- **[Apprise API](https://github.com/caronc/apprise-api)** - Push notifications
- **[Plex](https://www.plex.tv/)** - Library update, search item button (album, track artiste)
- **[Jellyfin](https://jellyfin.org/)** - Library update, search item button (album, track artiste)
- **[Navidrome](https://www.navidrome.org/)** - Search item button (album, track artiste)
- **Webhook push over** - Push notifications using webhook (MatterMost)

### Companion app

- Song recognition : [Shazarr project](https://github.com/cstaelen/shazarr) (Android) 

### Technicals

- Server-side download list processing
- UI built with **ReactJS** + **ExpressJS** API
- Self-hostable with **Docker** (`linux/amd64` and `linux/arm64`)
- Download Tidal content with [Tiddl (3.1.5)](https://github.com/oskvr37/tiddl/tree/v3.1.5)

### Integration & Automation

- **REST API** - Integrate Tidarr with external applications and automation tools
- **Custom scripts** - Execute your own shell scripts during post-processing pipeline (after download, before moving to library)

## GETTING STARTED

Example docker-compose.yml :

```yaml
services:
    tidarr:
        image: cstaelen/tidarr
        container_name: 'tidarr'
        ports:
            - 8484:8484
        volumes:
            - /any/folder/to/tidarr/config:/shared
            - /any/folder/to/library:/music
        restart: 'unless-stopped'
```

**or**

```bash
docker run  \
		--rm \
		--name tidarr \
		-p 8484:8484 \
		-v /any/folder/to/tidarr/config:/shared \
		-v /any/folder/to/library:/music \
    cstaelen/tidarr:latest
```

## TIDAL AUTHENTICATION

(if no `tiddl.json` file provided) :

Authorize your device using the UI token dialog

**or**

```bash 
docker compose exec -it -e tidarr tiddl auth login
```

**or**

```bash 
docker exec -it -e tidarr tiddl auth
```

## OPTIONS

### Download settings

⚠️ Beware to set the right template path

To set your download options you can :
- use the UI configuration editor in settings dialog
- edit toml file `/your/docker/path/to/tidarr/config/.tiddl/config.toml`.

→ [**Tiddl config options**](https://github.com/oskvr37/tiddl/blob/main/docs/config.example.toml)

→ [**Tiddl path templating**](https://github.com/oskvr37/tiddl/blob/main/docs/templating.md)


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

**\* Syntax:**
- Minute (0 - 59)
- Hour (0 - 23)
- Day of the month (1 - 31)
- Month (1 - 12)
- Day of the week (0 - 7) (Sunday is both 0 and 7)

### Custom CSS

You can customize Tidarr's appearance using the UI in settings dialog, or by editing the `custom.css` file. This file is automatically created in your config folder on first launch.

**File location**: `/your/docker/path/to/tidarr/config/custom.css`

### Download History

Track your downloaded items with the history feature. When enabled, Tidarr will maintain a list of all downloaded content and mark items as already downloaded in the UI.

```yaml
environment:
  - ...
  - ENABLE_HISTORY=true
```

**Features:**
- Persistent download tracking across restarts
- Visual indicators for already downloaded items (green checkmark)
- Manual history clearing available in settings dialog

## SERVICES

### Beets

Add to your *docker-compose* file in `environment:` section :

```yaml
environment:
  - ...
  - ENABLE_BEETS=true
```   

Beets options in `</mounted/config/folder/>beets-config.yml`:

### Plex integration

You can active:
- Plex scan after download
- Plex search button on artist, album and track pages

Add to your *docker-compose* file in `environment:` section :

```yaml
environment:
  - ...
  - PLEX_URL=<url|ip:port>
  - PLEX_LIBRARY=<music_library_id>
  - PLEX_TOKEN=<x-plex-token>
  # Optional - if not set, update whole library
  - PLEX_PATH=/path/to/music/library
```

- **PlexToken** : your Plex token : https://www.plexopedia.com/plex-media-server/general/plex-token/
- **Library ID** : In Plex server web ui, go to your music library tab and check `source=` in the URL
  http://192.168.1.20:32400/web/index.html#!/media/abcdef12345678/com.plexapp.plugins.library?**source=3**
- **Folder (optional)** : path to folder to scan url (if not set, all music library will be scanned)

> [!NOTE]
> All Plex API queries are proxied through the Tidarr backend to avoid CORS issues and keep your Plex token secure. The search button displays real-time result counts (artists, albums, tracks) from your Plex library.

Doc : https://www.plexopedia.com/plex-media-server/api/library/scan-partial/

### Jellyfin integration

You can active:
- Jellyfin scan after download

Add to your *docker-compose* file in `environment:` section :

```yaml
environment:
  - ...
  - JELLYFIN_URL=<url|ip:port>
  - JELLYFIN_API_KEY=<X-Emby-Token>
```

- **Jellyfin API Key** : your Jellyfin API Key : Go to Dashboard -> API Keys

> [!NOTE]
> All Jellyfin API queries are proxied through the Tidarr backend to avoid CORS issues and keep your Jellyfin API Key secure. The search button displays real-time result counts (artists, albums, tracks) from your Jellyfin library.

### Navidrome search

You can active the Navidrome search button this way.

To active the Navidrome search button on artist, album and track pages, add to your *docker-compose* file in `environment:` section :

```yaml
environment:
  - ...
  - NAVIDROME_URL=http://navidrome.url
  - NAVIDROME_USER=navidrome_user
  - NAVIDROME_PASSWORD=navidrome_password
```

> [!NOTE]
> All Navidrome API queries are proxied through the Tidarr backend to avoid CORS issues and keep your credentials secure. The search button displays real-time result counts (artists, albums, tracks) from your Navidrome library using the Subsonic API.

### Gotify

Add to your *docker-compose* file in `environment:` section :

```yaml
environment:
  - ...
  - GOTIFY_URL=<url|ip:port>
  - GOTIFY_TOKEN=<gotify_app_token>
```

### Ntfy

Add to your *docker-compose* file in `environment:` section:

```yaml
environment:
  - ...
  - NTFY_URL=<url|ip:port>
  - NTFY_TOPIC=<ntfy_topic>
  - NTFY_TOKEN=<ntfy_token_security> # optional if it is not public
  - NTFY_PRIORITY=<ntfy_priority> # optional (default=3)
```

### Apprise API

Add to your *docker-compose* file in `environment:` section :

```yaml
environment:
  - ...
  - APPRISE_API_ENDPOINT=http://{apprise_api_url}:{port}/notify/{config_id}
  - APPRISE_API_TAG=tidarr # optional
```
If no tag is defined, default tag value will be "all".

### Webhook push over

Many push over services can be used as an URL to curl with a payload.
Example with MatterMost :

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

## ADVANCED

### Custom Processing Script

Tidarr supports executing a custom shell script during the post-processing pipeline. This allows you to perform custom operations on downloaded files before they are moved to your library.

> [!NOTE]
> **Interact with Tidarr download process**
>
> 1. Create a shell script named `custom-script.sh` in your config folder (the mounted `shared/` volume)
> 2. The script will be automatically detected and executed during post-processing
> 3. The script runs **after** the tiddl download process (if not deactivated)
> 
> To keep the benefits of post processing, all your files must be in the download folder using `PROCESSING_PATH` var available in `custom-script.sh`.
>
> 📖 [View complete API documentation](docs/CUSTOM_SCRIPT_DOCUMENTATION.md)

### NO DOWNLOAD

If you want to use Tidarr only as UI and not download files, you can set `NO_DOWNLOAD=true` in the environment variables.

This way you can use Tidarr to manage your download history, watchlist, and keep benefits of json DB (`sync_list.json`, `queue.json`) to manage download via custom scripts.

> [!NOTE]
> **Unecessary configurations**
>
> In NO_DOWNLOAD mode those configurations are unecessary:
> - Docker library volume can be omit
> - `.tiddl/config.toml` has no effect
>

### API Documentation

If you want to interact with Tidarr from other applications (scripts, external services, automations), you can use the Express API.

> [!NOTE]
> **Integration with other applications**
>
> Tidarr's REST API allows you to:
> - Add downloads (albums, tracks, playlists, etc.)
> - Manage the queue (pause, resume, delete)
> - Synchronize playlists
> - Manage Tidal authentication
> - Customize configuration
>
> 📖 [View complete API documentation](docs/API_DOCUMENTATION.md)

## User requests
As I'm the only maintainer for now, user requested features can take time.
1) Feel free to create an issue with `enhancement` or `bug` tag.
2) Be my guest, fork and dev !

## DONATE

If you would like to support this project, please do not hesitate to make a donation. It contributes a lot to motivation, gives me the energy to continue maintaining the project and adding the features requested by the users :)

<a href="https://www.buymeacoffee.com/clst" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="40" width="160"></a>

## DEVELOP

Want more features and/or contribute ? Be my guest, fork and dev <3

Check docker environment variables in `compose.yml` before running :

```bash
make dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Multi-platform Docker builds

The `docker-build` Makefile target now relies on [Docker Buildx](https://docs.docker.com/build/buildx/) so you can produce images for several architectures in one command.

- Build a multi-platform image (default: `linux/amd64` and `linux/arm64`):

```bash
make docker-build IMAGE_TAG=latest BUILD_VERSION=1.2.3
```

- Build a custom platform image or local image for your host (example `linux/arm64`):

```bash
make docker-build PLATFORMS=linux/arm64 IMAGE_TAG=dev BUILD_VERSION=0.0.0-dev
```

Run tests :

```bash
make testing-build
make testing-run
```

## PURPOSES

- Renovate old torrent dl media library with full FLAC
- Just for coding
- Just for fun

## RESOURCES

- https://github.com/oskvr37/tiddl
- https://github.com/yaronzz/Tidal-Media-Downloader
- https://github.com/hmelder/TIDAL/wiki/search
- https://github.com/RandomNinjaAtk/arr-scripts (Lidarr extended scripts)
