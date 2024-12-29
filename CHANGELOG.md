# Changelog
Tidarr notable changes.

[Keep a Changelog](http://keepachangelog.com/en/1.0.0/) format.

## 📦 0.1.11
### 🚀 Added
* [Front] Redirect to requested url after login
* [Front] Album page - show tracks
* [Front] Playlist page - show tracks
* [Front] Track page - show track infos
### 🖍 Changed
* [Chore] Refacto : explode search logic in routes

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