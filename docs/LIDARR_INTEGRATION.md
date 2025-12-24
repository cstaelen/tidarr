# Lidarr Integration Guide

Tidarr can be integrated with Lidarr as a Newznab indexer to automatically search and download albums from Tidal. This allows you to leverage Lidarr's powerful library management while using Tidarr for high-quality music downloads.

## Table of Contents

- [Quick Setup](#quick-setup)
- [How It Works](#how-it-works)
- [Configuration Options](#configuration-options)
- [Search Algorithm](#search-algorithm)
- [Troubleshooting](#troubleshooting)
- [Advanced Topics](#advanced-topics)

## Quick Setup

### 1. Add Tidarr as an Indexer in Lidarr

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
| **API Key** | Get from Tidarr (see below) |
| **Categories** | `3000` (Audio), `3010` (Audio/MP3), `3040` (Audio/Lossless) |

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
>
> **If no authentication:**
> - Leave the API Key field empty
>
> Lidarr will send the API key via the `X-Api-Key` header or `?apikey=` query parameter (standard *arr protocol)

4. Click **Test** to verify the connection
5. Click **Save** to complete the setup

### 2. Configure Download Client

If there is no Usenet download client, you must add Lidarr's **Usenet Blackhole** download client:

1. Go to **Settings → Download Clients** in Lidarr
2. Click **+** and select **Usenet Blackhole**
3. Configure:
   - **Name**: Tidarr Blackhole
   - **Nzb Folder**: Any temporary folder (e.g., `/tmp`)
   - **Watch Folder**: Leave empty (not needed)
4. Click **Test** and **Save**

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

## Configuration Options

### Tidarr Settings

The quality and format of downloaded albums are controlled by your Tidarr configuration:

- **Quality**: Set in Tiddl config.toml file
  - `low`: M4A 96kbps
  - `normal`: M4A 320kbps
  - `high`: 16-bit FLAC
  - `max`: 24-bit FLAC (up to 192kHz if available)

- **Template path**: set in `.tiddl/config.toml`

## Search Behavior

### What to Expect

Tidarr uses smart matching to find the best album results from Tidal:

✅ **Works well with**:
- Standard album searches: `"Artist Album Name"`
- Artists with special characters: `"AC/DC"`, `"N.W.A"`, etc.
- Partial album titles: Searches for `"For Those About to Rock"` will find `"For Those About to Rock (We Salute You)"`
- Self-titled albums: `"Bad Religion Bad Religion"` correctly identifies self-titled albums
- Multiple editions: Automatically selects the best matching edition (usually Standard over Deluxe)

⚠️ **Limitations**:
- **Album not on Tidal**: If an album isn't available on Tidal, no results will be returned
- **Very different naming**: If Tidal uses a significantly different album title, matching may fail
- **Artist-only matches**: If only the artist matches but not the album title, no results (prevents wrong downloads)
- **Top 50 results**: Only searches the first 50 results from Tidal - very obscure albums may be missed

### Search Tips

**For best results**:
1. Use standard album names without extra info
   - ✅ Good: `"Pennywise All or Nothing"`
   - ❌ Avoid: `"Pennywise - All or Nothing (2012) [Deluxe]"`

2. If automatic search fails, try manual search with simpler queries
   - Instead of full album name, try just the first few words

3. Check if the album exists on Tidal first
   - Not all albums are available on Tidal (licensing restrictions)

4. For artists with special characters, both formats work:
   - `"AC/DC Power Up"` and `"AC DC Power Up"` will both work

### When No Results Are Found

If Lidarr shows no results from Tidarr:

1. **Check Tidal availability**: Search for the album manually on Tidal's website/app
2. **Try simpler query**: Use just artist name and first word of album
3. **Check logs**: Tidarr logs show what was searched and why results were filtered
4. **Verify authentication**: Make sure Tidal auth is still valid in Tidarr settings


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
