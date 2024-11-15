# Changelog
Tidarr notable changes.

[Keep a Changelog](http://keepachangelog.com/en/1.0.0/) format.

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