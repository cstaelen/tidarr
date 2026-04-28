# Changelog
Tidarr notable changes.

[Keep a Changelog](http://keepachangelog.com/en/1.0.0/) format.

## 📦 1.2.2
### ⚠️ Breaking Changes
- [API] `DOWNLOAD_BATCH_CRON` has been replaced by `DOWNLOAD_BATCH_DELAY` (minutes) to be more accurate. 
**Don't forget to update your docker env var** #750
### 🚀 Added
- [Front] Add processing queue pagination and search filter #750
- [Front] Add watchlist pagination, sort order, search filter #750
### 🖍 Changes
- [Front] Discography download expands albums only when processing #750
- [API] Batch download count now skips existing albums #750


## 📦 1.2.1
### 🚀 Added
- [API] Add new `ARTIST_SINGLE_DOWNLOAD` env var to bulk download discographies #713
- [Front] When queue is paused, you can single-download a specific item in the queue.
- [API] Add batch download limit to pause your download after x completed items #722
- [Devops] Allow custom listening port #734
### 🐛 Fixed
- [API] Fix favorite tracks download for large libraries by using native tiddl command instead of temporary playlist (was limited to 500 tracks) #721
- [Front] Fix sorted playlists pager #730 
### 🖍 Changes
- [API] Tidal playlist fetches now renew token if needed
- [Lidarr] Apply PUID and PGID to Lidarr downloaded files
- [Front] Add single download button in no-download mode #684
- [Front] Add toggle finished items button in queue list
- [Docker] Load custom `/config/requirements.txt` file to extend your scripts
- [API] Update Tiddl to 3.2.3
- [API] Allow POST queries over Tidal proxy

## 📦 1.2.0
### 🐛 Fixed
- [API] Fix playlist albums download (#654)
- [API] Fix playlist hard-coded country code in url
- [DevOps] Fix bad file access isolation on startup (#667)
- [Plex] Mixes and fav tracks M3U files are now uploaded to Plex (#682)
### 🚀 Added
- [Front] Add sorting selection on favorite track list (#671)
- [Front] Add public url env var for Jellyfin, Plex, Navidrome search buttons (#688)
- [API] Add item name in custom scripts (#692)
### 🖍 Changes
- [API] Fav tracks are now converted in playlist before being downloaded with m3u. (#657)
- [API] Playlist albums download can now handle more than 100 tracks
- [API] Temporary playlists (used by mixes and fav tracks) are now "private" (#657)
- [API] Download retries occured only on connection error (#664)
- [API] Discography download now use per-album processing (#687)
- [Lidarr] Fixed path templating for Lidarr downloads
- [Tiddl] Update Tiddl to 3.2.2

## 📦 1.1.9
### 🚀 Added
- [API] Add max 5 auto retries on download failure
- [API] Add m3u for favorite tracks download
### 🐛 Fixed
- [Front] Fix tiddl Error detection

## 📦 1.1.8
### 🚀 Added
- [Lidarr] Add `Tidarr` keyword to Lidarr release search results
### 🖍 Changes
- [Lidarr] Auto-renew token on 401 error
- [DevOps] Monitor python packages with dependabot
- [API] Use tidal api v2 for searching albums
### 🐛 Fixed
- [Front] Fix missing token for media library search button

## 📦 1.1.7
### 🚀 Added
- [API] Add Navidrome library update #614 
- [Front] Remove from queue by clicking twice on the download button
- [Front] Prompt changelog dialog on docker image update #597 
- [API] Add `custom-post-script.sh` running after files moved to library. #614 
- [API] Plex scan also uploads the m3u file to Plex (Thanks to @The24thDS)
- [Front] Add progress indicator in processing queue #624
### 🖍 Changes
- [Lidarr] Apply replay gain for Lidarr downloads if enabled
- [Lidarr] Tidarr return results for each quality as a separate album to allow Lidarr to choose the quality to download
- [API] Force proxy for all tidal.com requests (ENABLE_TIDAL_PROXY can be removed).
- [API] Refacto token refresh logic
### 🐛 Fixed
* [Front] Fix bad url on favorites processing items #624
* [API] Avoid node process from being sent over SSE #625 

## 📦 1.1.6
### 🖍 Changes
- [API] Update Tiddl to 3.2.0

## 📦 1.1.5
### 🖍 Changes
- [API] Adjust token renew intervale
### 🐛 Fixed
- [API] Re-queue processing item from file after failed
- [API] Fix terminal dialog cancel button state
- [Front] Fix download error handler
- [Front] Fix video daily mixes pages

## 📦 1.1.4
### 🚀 Added
- [API] Parallelize download queue and processing queue #581
### 🖍 Changes
- [Front] Move parameters from dialog to page


## 📦 1.1.3

⚠️ **Update your `download_path` with your final output path** (music library)

To be more compliant with tiddl process, `/shared/.processing` is now abstracted by Tidarr.
After download and post-processing finished, files are moved to `download_path` and then deleted from `/shared/.processing`.

⚠️ **LIDARR SETUP: Update your downloads docker volume**

Tidarr provides now files to `/shared/nzb_downloads` folder.
It must be mounted as docker volume on the same physical path as `/downloads` Lidarr volume to allow Lidarr to import files.

See [Lidarr Integration Guide](LIDARR_INTEGRATION.md) for more details.

### 🚀 Added
- [API] ⚠️ Tidarr downloads now to `download_path` toml config for better compliance with Tiddl #313
- [API] Add `PLAYLIST_ALBUMS` env var to download complete albums of each track of a playlist #584
- [Front] Add back button to processing pages
- [Front] Add processing state and count in browser tab
### 🐛 Fixed
- [Front] Fix download links on processing page
- [Lidarr] Fixx delete request from Lidarr queue
### 🖍 Changes
- [API] Run all post processing step as async spawn to avoid blocking. #581
- [Front] Add url hash navigation for home tabs
- [API] Add dedicated download folder folder Lidarr downloads


## 📦 1.1.2
### 🚀 Added
- [API] Add Lidarr queue management support
- [API] Add Lidarr import + post processing support 
### 🖍 Changes
- [Front] Move processing queue to a separate page to avoid UI lag
- [Front] Move watch list to to processing page

## 📦 1.1.1
### 🚀 Added
- [Front] Add API key manager in configuration dialog
- [API] Add X-API-KEY header to authenticate external queries
- [API] Add replay gain post processing step (REPLAY_GAIN=true)
- [API] BETA - Add Lidarr NZB indexer endpoints
- [API] BETA - Add Lidarr Sabnzbd download client endpoints

## 📦 1.1.0
### 🚀 Added
- [API] Add support for OIDC authentication #409
### 🐛 Fixed
- [API] Fix default m3u base path #562

## 📦 1.0.9
### 🐛 Fixed
- [Front] Fix player CORS issue
### 🖍 Changes
- [API] Move init.sh script to typescript
- [Docker] Update custom ownership appliance on /shared folder

## 📦 1.0.8
### 🐛 Fixed
- [API] Fix reload tiddl conf after edit #537
- [API] Fix Quoted m3u override issue
- [API] Fix custom CSS not applying #540

## 📦 1.0.7

⚠️ Docker volume path as changed. Beware to check your path in `docker-compose.yml` and `config.toml` tiddl congif files.

### 🚀 Added
- [API] Add `NO_DOWNLOAD` env var to use Tidarr UI only and process download with custom scripts. #517
- [API] Add persistant history separated from queue #512
- [Front] Add track audio player #513 (Thanks @unthoiz)
### 🖍 Changed
- [Tiddl] Tidarr use now toml `scan_path` and `download_path` parameters
- [Docker] Update docker volume path to `/shared` and `/music`
- [Docker] Move `/home/app/standalone`to `/tidarr`
- [API] json-db: add cache for file reading
- [API] Update tiddl to 3.1.5
### 🐛 Fixed
- [M3U] Preserve $ characters in artist names #532 (Thanks @djdubd)

## 📦 1.0.6
### 🚀 Added
- [API] Add NTFY.sh notification service
- [API] Add Jellifyn library scan
- [Front] Add Jellifyn search button on artist, album and track pages
### 🐛 Fixed
- [API] Fix tiddl console raw output
- [API] Fix remove from watch list button
### 🖍 Changed
- [e2e] Playwright test isolation with TestContainers
- [e2e] Remove mocks, use docker prod image
- [Docker] Simplify Dockerfile
- [API] Update tiddl to 3.1.3

## 📦 1.0.5
### 🐛 Fixed
- [Beets] Fix tags writing
- [API] Fix Tiddl error parsing

## 📦 1.0.4
### 🚀 Added
- [Beets] Add plugins: `fetchart, lastgenre, lastimport, advancedrewrite`
### 🐛 Fixed
- [API] Fix ignored umask issue
- [API] Fix condition race issue with token refresh
### 🖍 Changed
- [API] Update to tiddl 3.1.2
- [Front] Re-activate favorites download
- [Front] Video download is back

## 📦 1.0.3
### 🚀 Added
- [Front] Add Plex search button on artist, track and album pages #470
- [Front] Add Navidrome search button on artist, track and album pages
- [API] Add `custom-script/.sh` in shared folder to customize post-processing pipeline #370
### 🐛 Fixed
- [API] Fix ignored umask #463
- [API] Fix albums stuck in .processing folder due to unhandled errors #477
- [Docker] Fix missing curl binary #474 (thanks @unthoiz)
### 🖍 Changed
- [API] Add `json-db` to handle data storage in json files
- [API] Update Tidal token-refresh handler (smart refresh based on expires_at, async process)
- [API] Improve error handling in post-processing pipeline

## 📦 1.0.2
### 🚀 Added
- [Front] Add Tiddl TOML config live editor
- [Front] Add colors in CSS editor
- [Front/API] Add a queue play/pause button.
### 🖍 Changed
- [API] Update Tiddl to 3.1.0
- [API] Update some config dialog UI
- [API] Restore mix-to-playlist processing to get more metadatas #459
- [API] Make Plex scan requests more intelligent by scanning new folders only #456
- [API] Refacto api (update endpoints to standard syntax + method)
- [Front] Update some config dialog UI
- [Front] Queue list is now entirely saved in a file (shared/queue.json) #465
- [Docker] Optimize image building
### 🐛 Fixed
- [Front] Fix `video_quality` front error
- [API] Fix ignored umask #463

## 📦 1.0.1
### 🐛 Fixed
- Fix ignoring custom toml config file #452

##📦 1.0.0
### ⚠️ BREAKING CHANGES
#### Tiddl 3.0 Migration
- **Re-authentication required**: All users must re-authenticate with Tidal after upgrading
- **Quality naming change**: "master" quality renamed to "max" (24-bit 192kHz)
- **Configuration format**: Migrated from JSON to TOML format
  - Old: `config/tiddl.json`
  - New: `config/.tiddl/config.toml` + `config/.tiddl/auth.json`
- **Path templates changed**: Review and adjust your previous settings (quality, paths, templates)
- **Favorites download disabled**: Download/sync all favorite albums/tracks/playlists is disabled and will reimplemented in time by Tiddl team.

### 🎉 Features

- **Tiddl 3**: Major update of Tiddl to version 3
- **Watchlist**: Add new "Sync now" buttons in watchlist #447
- **Watchlist**: Add "Remove all" in watchlist 
- **Live console output**: Real-time terminal output streaming with Server-Sent Events (SSE)
- **Processing terminal**: Add button to cancel/remove in modal
- **Docs**: Add new "Docs" tab in config dialog

### 🔧 Technical Changes
- **Mix download improvements**: Remove mix-to-playlist conversion flow
- **PUID/PGID support**: Simplified permissions management using `su-exec` for node.
- **Python requirement**: Now requires Python 3.13 (was 3.x)
- **Docker base image**: Changed from LinuxServer.io Alpine to official Python 3.13 Alpine
- **Download folder moved** Reorganized download directory structure. Moved incomplete to `.processing` mounted folder to avoid #436.
- **Check API endpoint**: move /check endpoint to settings

### 🔄 Migration Notes

Users upgrading from v0.4.x will need to:
1. **Re-authenticate with Tidal** (old tokens incompatible)
2. **Reconfigure tiddl settings** - Old `tiddl.json` is not automatically migrated
   - Default configuration will be created at `config/.tiddl/config.toml`
   - ⚠️ Review and adjust your previous settings (quality, paths, templates)

## 📦 0.4.6
### 🐛 Fixed
* Fix artist page crashes #434
### 🖍 Changed
* Update large display UI mode
* Quality button are not unselectable anymore

## 📦 0.4.5
### 🚀 Added
* [Front] A button to download all videos of an artist was added on artist page
### 🖍 Changed
* [API] Run beets only for albums
* [API] Fix undefined label in notification
* [Front] Fix console ANSI chars encoding
* [Front] Update display mode UI
* [Docker] Remove useless env vars : `ENABLE_PLEX_UPDATE`, `ENABLE_GOTIFY`, `ENABLE_APPRISE_API`
* [API] Update tiddl to 2.8.0

## 📦 0.4.4
### 🖍 Changed
* [Front] Update console UI
* [Docker] use buildx from multi-platform image by @mortezaPRK #420

## 📦 0.4.3
### 🖍 Changed
* [API] Sync cron uses TZ env var if exists or fallback to system timezone 
### 🐛 Fixed
* [API] Fix SYNC_CRON_EXPRESSION issue #417

## 📦 0.4.2
### 🚀 Added
* [API] Trigger sync button add to download queue #414
* [Front] Add buttons to clear queue list
* [API/Front] Download & sync favorite tracks/albums/playlists #412
### 🖍 Changed
* [API] Update tiddl to `2.7.0`

## 📦 0.4.1
### 🚀 Added
* [API] Add push over webhook and `PUSH_OVER_URL` env var
### 🖍 Changed
* [API] Update tiddl to `2.6.5`

## 📦 0.4.0
### 🚀 Added
* [Front] Add custom CSS #383
* [API] Add umask env var for output file chmod #396
* [API/Front] Watch and sync artist content #400
### 🖍 Changed
* [Front] Move sync list from settings dialog to home page tabs "Watch list"
* [API] Refacto server sent events (performances should be significantly enhanced) 
* [API] Handle tiddl config from shared folder (instead of /root) #382

## 📦 0.3.8
### 🖍 Changed
* [API] Update tiddl to `2.6.4`
* [API] Save download queue to file

## 📦 0.3.7
### 🖍 Changed
* [API] Update tiddl to `2.6.3`
* [API] Clean folder before processing
### 🐛 Fixed
* [API] Tolerate tiddl metadata error
* [API] Process m3U only for mix and playlist

## 📦 0.3.6
### 🚀 Added
* [Front] Add track version to track title #368
### 🐛 Fixed
* [API] Fix sync list "output" issue #367
* [Front] Fix token missing dialog reload loop #380
* [Tiddl] Update to `2.6.3a1` - Fix OAUTH issue (thx @oskvr37) #380

## 📦 0.3.5
### 🚀 Added
* [API] Update tiddl: add playlist `.m3u` file by setting `save_playlist_m3u` to `true` in `tiddl.json`
* [Docker] Custom `.m3u` file track path with `M3U_BASEPATH_FILE=` in docker env.
* [API/Front] Sync playlists and mixes. Default interval is daily or use custom with `SYNC_CRON_EXPRESSION`
### 🖍 Changed
* [API] Update tiddl from `2.5.2` to `2.6.2`
* [Chore] Renovate some dependencies
### 🐛 Fixed
* [Front] Fix infinite refresh when token is expired

## 📦 0.3.4
### 🚀 Added
* [Front] Add select dropdown to sort playlists and favorites (#342)
### 🐛 Fixed
* [API] Fix mixes download issue (#344)
* [CI] Fix pre-release deployement
### 🖍 Changed
* [Chore] Renovate some dependencies

## 📦 0.3.3
### 🚀 Added
* [API] Use `ENABLE_TIDAL_PROXY` var to proxy tidal API queries for more privacy
* [CI] Yarn audit

## 📦 0.3.2
### 🖍 Changed
* [API] Update `tiddl` from `2.5.1` to version `2.5.2`
* [API] Download process now skips existing files by setting `scan_path` param in `tiddl.json` (#313)
* [Front] Set image attribute `referer-policy="no-referer"` (#321)
* [Front] Show quality badge on result items only if not equal to "lossless"
* [Front] Update some part of result item UI
### 🚀 Added
* [Docker] New env var "LOCK_QUALITY" to force only `tiddl.json` quality (#322)
### 🐛 Fixed
* [Front] Quality selector struggle on "high" on load (#322)

## 📦 0.3.1
### 🖍 Changed
* [Docker] ⚠️ **Now there is only one docker volume to mount for the music library destination**
* [API] ⚠️ **Folder management and format is now handle in `tiddl.json` file.**
* [API] Use tiddl `-V` parameters for video DL
* [Front] Hide/Show video lists if tiddl `download_video` parameter is false/true.
### 🚀 Added
* [Front] Add an update warning modal
* [Front] Add tiddl config in config dialog
### 🐛 Fixed
* [Front] Fix skeleton loaders
* [API] If PUID and PGID are set, `cp` uses `-rfp` args
### 🧹 Renovate
* [Chore] Move python deps to `requirements.txt` file

## 📦 0.3.0
### 🚀 Added
* [Front] Add home page Tidal trends
* [Front] Add "My Favorites" page
* [Front] Add "My Playlists" page
* [Front] Add "My Mixes" page
* [Front] Add additional content to "Artist" page
* [Front] Add Artist mix button to "Artist" page
* [Front] Add "Explicit" tag on tracks and albums
* [Front] Quality button now define the download format/quality
* [Front/API] Mixes are now downloadable as playlist
* [API] Add `"download_video": true` Tiddl parameter in `tiddl.json`
* [Front] Add changelog in settings dialog
### 🖍 Changed
* [Front] Refacto tidal content fetching
* [Front] Use API Tidal using Tiddl credentials
* [API] Update `tiddl` from `2.4.0` to version `2.5.1`
* [API] Update `cp` command for download content by removing `-p` parameter
* [Chore] Update dependencies
### 🐛 Fixed
* [Front] Download button states strange behavior

## 📦 0.2.1
### 🖍 Changed
* [API] Country code is taken from `tiddl_config` instead of environment variable (you can remove it in your docker compose file).
* [Ops] App version is handle by github tag versioning

## 📦 0.2.0
### 🖍 Changed
* [API] Update `tiddl` from `2.3.4` to version `2.4.0`
* [API] Add cover download feature
* [Chore] Update dependencies

## 📦 0.1.22
### 🖍 Changed
* [API] Update `tiddl` from `2.3.3` to version `2.3.4` (fix token issue)
* [Chore] Update dependencies

## 📦 0.1.21
### 🖍 Changed
* [API] Update `tiddl` from `2.3.2` to version `2.3.3`
* [Chore] Update dependencies

## 📦 0.1.20
### 🚀 Added
* [API] Support for Apprise API notifications
### 🐛 Fixed
* [API] Gotify notification failed on double quotes present in title
### 🖍 Changed
* [Chore] Update dependencies

## 📦 0.1.19
### 🐛 Fixed
* [Front] Show music videos on artist page
### 🖍 Changed
* [Front] Update track mobile template
* [API] Update `tiddl` from `2.3.1` to version `2.3.2`
* [Chore] Update dependencies

## 📦 0.1.18
### 🖍 Changed
* [API] Update `tiddl` from `2.2.2` to version `2.3.1`
* [Chore] "singles_filter" download option is now available
* [Chore] Update dependencies

## 📦 0.1.17
### 🚀 Added
* [Chore] Setup Dependabot
### 🖍 Changed
* [Front] Enhance token console modal output
* [Chore] Renovate dependencies

## 📦 0.1.16
### 🖍 Changed
* [Front] Enhance console modal output
* [API] Update `tiddl` from `2.2.1` to version `2.2.2`
* [API] Add server-sent events 

## 📦 0.1.15
### 🚀 Added
* [Front] New "get all releases" button on artist pages
* [Front] Add music video search
### 🖍 Changed
* [Front] Renovate: move from `react-scripts` to `vitejs`
* [Front] Renovate: update `reactjs` from `18` to version `19`
* [Front] Renovate: update other deps
* [API] Update `tiddl` from `1.9.4` to version `2.2.1`
* [API] Update deps
* [e2e] Update `playwright`

## 📦 0.1.14
### 🐛 Fixed
* [Front] Show "No results" message instead of loader when tidal fetch fail

## 📦 0.1.13
### 🖍 Changed
* [API] Gotify notification title shows content type instead of "album"
### 🐛 Fixed
* [Chore] Fix missing `ffmpeg-python` pip package (#57)

## 📦 0.1.12
### 🚀 Added
* [Front] Show unavailable tracks (if exists) in albums and playlists
* [Front] Add lazy load image with placeholder 
### 🖍 Changed
* [Chore] Update docker linuxserver images
### 🐛 Fixed
* [API] Fix tiddl issue when download album with unavailable track #57

## 📦 0.1.11
### 🚀 Added
* [Front] Redirect to requested url after login
* [Front] Album page - show tracks
* [Front] Playlist page - show tracks
* [Front] Track page - show track infos
### 🖍 Changed
* [Front] New style for track results
* [Chore] Refacto : explode search logic in routes
### 🐛 Fixed
* [Front] Fix login multiple redirect

## 📦 0.1.10
### 🚀 Added
* [Front] Search track by direct URL
* [Front] Search mix/radio by direct URL
### 🐛 Fixed
* [Front] Fix URL search - strip URL query params

## 📦 0.1.9
### 🖍 Changed
* [Front] Update wording
### 🐛 Fixed
* [API] Kill orphean token process running in background

## 📦 0.1.8
### 🚀 Added
* [Front/API] New Tidal token request dialog
* [Front/API] Reset Tidal token in configuration dialog
* [Front] Add playlists in results
### 🖍 Changed
* [API] Better obsolete token detection
* [Front] Better api fetch error handling
* [Front] Refacto api fetcher
### 🐛 Fixed
* [Front] Fix mobile auth form layout

## 📦 0.1.7
### 🚀 Added
* [Front] New environment var to set default quality search filter: `REACT_APP_TIDARR_DEFAULT_QUALITY_FILTER`
* [Front] Add a new display mode for grid results
* [Front] Add optional authentication modal: `ADMIN_PASSWORD`
* [API] Add authentication with jwt process
### 🖍 Changed
* [Front] Selected quality filter is now set in localstorage

## 📦 0.1.6
### 🐛 Fixed
* [API] Fix ffmpeg conversion

## 📦 0.1.5
### 🚀 Added
* [API] Environnement var for playlist format
### 🐛 Fixed
* [API] Fix default playlist format
* [Front] Footer layout on mobile devices

## 📦 0.1.4
### 🚀 Added
* [API] Add "force track extension" option. (TIDDL_FORCE_EXT)

## 📦 0.1.3
### 🖍 Changed
* [API] Move from TidalMediaDownloader to Tiddl, max quality: 24 bit 192Khz 
* [Front] Optimize console output

## 📦 0.1.2
### 🖍 Changed
* [API] Chown and chmod downloads if PUID/PGID are set
### 🐛 Fixed
* [Front] Fix issue with pager on artist pages

## 📦 0.1.1
### 🚀 Added
* Add Matomo cookie free and anonimyzed data

## 📦 0.1.0
### 🧹 Renovate
* Update node deps
* Typescript 5
* Migrate to eslint 9

## 📦 0.0.8
### 🚀 Added
* [Front] Add update checker
* [Front] Add configuration dialog
* [CI] Add and fix flaky playwright tests 

## 📦 0.0.7
### 🚀 Added
* [Chore] Add Github CI
* [Chore] Add Github Playwright end-to-end testing desktop + mobile
* [Chore] Add code linter and formatter + CI
### 🖍 Changed
* [Front] Move from NextJS to ReactJS
* [Chore] Reduce docker image size
* [Chore] Refacto

## 📦 0.0.6
### 🚀 Added
* [Front] Download playlist by url
### 🐛 Fixed
* [Front] Add missing "no result" message
* [Chore] Remove boot up warning message 
* [Chore] Back to npm
* [Chore] Replace old dependencies

## 📦 0.0.5
### 🚀 Added
* [Front] Add visual filter on quality (Lossless/Hi res)

## 📦 0.0.4
### 🚀 Added
* [Front] Update to NextJS 14.0.4 and dependencies
* [Front] Add artist strict search
* [Front] Add artist page displaying all albums, single, EP, ...
* [Front] Add the ability to direct download by using Tidal share URL
### 🖍 Changed
* [API] Use container absolute path in ExpressJS
* [Chore] Use pnpm instead of yarn

## 📦 0.0.3
### 🖍 Changed
* [API] Enhance processing error handling
* [Front] Update download state UI
* [Front] Update mobile item card UI

## 📦 0.0.2
### 🚀 Added
* [API] Handle processing downloads with Express JS
* [Front] Live scroll in terminal dialog
* [Front] Item result title open Tidal browse web page.
### 🐛 Fixed
* [Front] Fix download button issue

## 📦 0.0.1
### 🚀 Added
* Initial project package