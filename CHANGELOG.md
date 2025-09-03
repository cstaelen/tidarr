# Changelog
Tidarr notable changes.

[Keep a Changelog](http://keepachangelog.com/en/1.0.0/) format.

## 📦 0.3.1
### 🖍 Changed
* [Docker] ⚠️ **Now there is only one docker volume to mount for the music library destination**
* [API] ⚠️ **Folder management and format is now handle in `tiddl.json` file.**
* [API] Use tiddl `-V` parameters for video DL
* [Front] Hide/Show video lists if tiddl `download_video` parameter is false/true.
### 🚀 Added
* [Front] Add an update warning modal
### 🐛 Fixed
* [Front] Fix skeleton loaders

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