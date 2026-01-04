# Lidarr Integration Guide

Tidarr can be integrated with Lidarr as a Newznab indexer to automatically search and download albums from Tidal. This allows you to leverage Lidarr's powerful library management while using Tidarr for high-quality music downloads.

## Table of Contents

- [Quick Setup](#quick-setup)
  - [1. Configure Download Client](#1-configure-download-client)
  - [2. Add Tidarr as an Indexer in Lidarr](#2-add-tidarr-as-an-indexer-in-lidarr)
  - [3. Verify Music Library Path](#3-verify-music-library-path)
- [How It Works](#how-it-works)
  - [Workflow](#workflow)
  - [Architecture](#architecture)
- [How Search Works](#how-search-works)
  - [Search Process](#search-process)
  - [What to Expect](#what-to-expect)
  - [Search Tips](#search-tips)
  - [When No Results Are Found](#when-no-results-are-found)
- [Advanced Topics](#advanced-topics)
  - [API Endpoints](#api-endpoints)
  - [Release Processing](#release-processing)
  - [Queue Management](#queue-management)
- [Resources](#resources)

## Quick Setup

> **Important:** Configure the download client FIRST (step 1), then the indexer (step 2). The indexer configuration needs to reference the download client you create.

### 1. Configure Download Client

Add Tidarr as a **SABnzbd** download client:

1. Go to **Settings → Download Clients** in Lidarr
2. Click **+** and select **SABnzbd**
3. Configure:

| Setting | Value |
|---------|-------|
| **Name** | Tidarr |
| **Enable** | ✅ Enabled |
| **Host** | `your-tidarr-url` (e.g., `192.168.1.245`) |
| **Port** | `8484` |
| **URL Base** | `/api/sabnzbd` |
| **API Key** | Get from Tidarr (see below) |
| **Category** | `music` (optional but recommended) |

> **Getting Your API Key:**
>
> **Option 1: Via Docker CLI (recommended)**
> ```bash
> docker exec tidarr cat /shared/.tidarr-api-key
> ```
>
> **Option 2: Via Tidarr Web UI**
> - Go to Settings → Security
> - Copy the API key displayed in the "API Key" section
>
> **If no authentication:**
> - Enter any value (e.g., `0000`) - it's required by Lidarr but won't be validated

4. Click **Test** to verify the connection
5. Click **Save**

> **Current Implementation Status:**
> - ✅ **Download triggering** (`addfile`) - Fully functional
> - ⚠️ **Queue status tracking** - Not yet implemented
> - ⚠️ **Download history** - Not yet implemented
> - ⚠️ **Progress tracking** - Not yet implemented
>
> For now, downloads will be triggered successfully but Lidarr won't see real-time queue/history status. Track downloads in Tidarr's UI instead.

### 2. Add Tidarr as an Indexer in Lidarr

1. Go to **Settings → Indexers** in Lidarr
2. Click **+** and select **Newznab**
3. Configure the indexer with these settings:

| Setting | Value |
|---------|-------|
| **Name** | Tidarr |
| **Enable RSS** | ❌ Disabled (optional) |
| **Enable Automatic Search** | ✅ Enabled |
| **Enable Interactive Search** | ✅ Enabled |
| **URL** | `http://your-tidarr-url:8484` |
| **API Path** | `/api/lidarr` |
| **API Key** | Same as download client (from step 1) |
| **Categories** | `3000` (Audio), `3010` (Audio/MP3), `3040` (Audio/Lossless) |
| **Download Client** | Select **Tidarr** (the SABnzbd client created in step 1) |

> **Important:** Make sure to select the Tidarr download client in the "Download Client" dropdown. This ensures that when Lidarr grabs an album from this indexer, it will use the correct download client.

4. Click **Test** to verify the connection
5. Click **Save** to complete the setup

### 3. Verify Music Library Path

Ensure Lidarr's music library path matches your Tidarr music volume:

- **Lidarr**: Settings → Media Management → Root Folders
- **Tidarr**: Docker volume mounted at `/music`

These paths should point to the same location.

## How It Works

### Workflow

1. **Search**: When you search for an album in Lidarr, it queries all configured indexers including Tidarr
2. **Query Processing**: Tidarr receives the search query and searches Tidal's catalog
3. **Smart Matching**: Results are filtered using a matching algorithm
4. **Results**: Matched albums are returned to Lidarr in Newznab format
5. **Download**: When you grab an album, Lidarr calls Tidarr's download endpoint
6. **Queue**: Tidarr adds the album to its processing queue
7. **Download**: Album downloads in high quality (FLAC up to 24-bit if available)
8. **Import**: Files are saved to your music library where Lidarr can import them

### Architecture

```
┌─────────┐         ┌─────────┐         ┌───────┐
│ Lidarr  │────────▶│ Tidarr  │────────▶│ Tidal │
│         │◀────────│ (API)   │◀────────│  API  │
└─────────┘         └─────────┘         └───────┘
     │                   │
     │                   │
     ▼                   ▼
┌─────────────────────────────┐
│    Shared Music Library     │
│         (/music)            │
└─────────────────────────────┘
```

## How Search Works

### Search Process

When Lidarr searches for an album, Tidarr:

1. **Receives the query** from Lidarr (either `t=music` with `artist`/`album` params or `t=search` with `q` param)
2. **Constructs search query**: Combines artist + album for `t=music` requests
3. **Queries Tidal API**: Searches for matching albums (up to 50 results)
4. **Returns all results**: Sends all Tidal results back to Lidarr in Newznab XML format
5. **Lidarr matches**: Lidarr's own matching algorithm selects the best result

**Important**: Tidarr acts as a simple indexer - it returns raw Tidal search results without filtering. Lidarr handles all matching and selection logic.

### What to Expect

✅ **Tidarr will return results for**:
- Any album available on Tidal
- All editions (Standard, Deluxe, Remastered, etc.)
- Up to 50 albums per search

⚠️ **Limitations**:
- **Album not on Tidal**: If an album isn't available on Tidal, no results will be returned
- **Tidal's search algorithm**: Results depend entirely on how Tidal's search API ranks albums
- **Result limit**: Only the top 50 results from Tidal are returned

### Search Tips

**For best results**:

1. **Ensure album exists on Tidal**
   - Check Tidal's website/app to verify availability
   - Not all albums are available due to licensing restrictions

2. **Let Lidarr's matching work**
   - Lidarr handles all matching logic - Tidarr just provides the raw results
   - Configure Lidarr's preferences for best matching behavior

3. **Check authentication**
   - Make sure Tidal auth is still valid in Tidarr settings
   - Expired tokens will result in no results

### When No Results Are Found

If Lidarr shows no results from Tidarr:

1. **Verify Tidal availability**: Search manually on Tidal to confirm the album exists
2. **Check Tidarr logs**: See what query was sent to Tidal and how many results returned
3. **Verify authentication**: Ensure Tidal token is valid in Tidarr settings
4. **Try manual search**: Use Lidarr's manual search to see all available results


## Advanced Topics

### API Endpoints

Tidarr implements these Newznab endpoints:

| Endpoint | Purpose | Authentication |
|----------|---------|----------------|
| `GET /api/lidarr?t=caps` | Returns indexer capabilities | API key via header or query param |
| `GET /api/lidarr?t=search&q=...` | Searches for albums | API key via header or query param |
| `GET /api/lidarr?t=music&artist=...&album=...` | Music-specific search | API key via header or query param |
| `GET /api/lidarr/download/:id` | Triggers album download | API key via header or query param |

**Authentication Methods:**
- Header: `X-Api-Key: your-api-key`
- Query param: `?apikey=your-api-key`

**Important:** The download URL returned in search results automatically includes the API key from the search request, so Lidarr can download without re-authenticating.


### Release Processing

Downloads triggered by Lidarr go through Tidarr's normal processing pipeline:

1. **Download** via Tiddl
2. **Beets tagging** (if enabled)
3. **Permission fixing** (UMASK)
4. **Custom script** (if `custom-script.sh` exists)
5. **Move to library** (`/music`)
6. **Plex/Jellyfin scan** (if configured)
7. **Notifications** (if configured)

### Queue Management

All Lidarr-triggered downloads:
- Are added to Tidarr's queue with ID
- Appear in Tidarr's UI
- Can be paused/resumed like any other download
- Respect queue order (sequential processing)

## Resources

- [Lidarr Documentation](https://wiki.servarr.com/lidarr)
- [Newznab API Specification](https://github.com/nZEDb/nZEDb/blob/dev/docs/newznab_api_specification.txt)
- [Tidarr API Documentation](API_DOCUMENTATION.md)
- [Custom Script Documentation](CUSTOM_SCRIPT_DOCUMENTATION.md)
