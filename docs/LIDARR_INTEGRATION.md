# Lidarr Integration Guide

Tidarr can be integrated with Lidarr as a Newznab indexer to automatically search and download albums from Tidal. This allows you to leverage Lidarr's powerful library management while using Tidarr for high-quality music downloads.

## Table of Contents

- [Quick Setup](#quick-setup)
  - [1. Configure Shared Volumes](#1-configure-shared-volumes)
  - [2. Configure Download Client](#2-configure-download-client)
  - [3. Add Tidarr as an Indexer in Lidarr](#3-add-tidarr-as-an-indexer-in-lidarr)
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
- [Troubleshooting](#troubleshooting)
  - [Lidarr doesn't detect completed downloads](#lidarr-doesnt-detect-completed-downloads)
  - [Downloads fail with authentication errors](#downloads-fail-with-authentication-errors)
  - [No search results from Tidarr](#no-search-results-from-tidarr)
- [Resources](#resources)

## Quick Setup

> **Important:** Configure the download client FIRST (step 1), then the indexer (step 2). The indexer configuration needs to reference the download client you create.


### 1. Configure Shared Volumes

**Required:** Both containers must share a common download directory for the import workflow to work.

**Docker Compose example:**

```yaml
services:
  tidarr:
    volumes:
      - ...
      - /path/to/lidarr/downloads:/shared/nzb_downloads  # Dedicated Lidarr download location

  lidarr:
    volumes:
      - ...
      - /path/to/lidarr/downloads:/downloads              # Same physical folder as Tidarr's nzb_downloads
```

### 2. Configure Download Client

Add Tidarr as a **SABnzbd** download client:

1. Go to **Settings → Download Clients** in Lidarr
2. Click **+** and select **SABnzbd**
3. Configure:

| Setting      | Value                              |
| ------------ | ---------------------------------- |
| **Name**     | Tidarr                             |
| **Enable**   | ✅ Enabled                         |
| **Host**     | `your-tidarr-url`                  |
| **Port**     | `8484`                             |
| **URL Base** | `/api/sabnzbd`                     |
| **API Key**  | Get from Tidarr (see below)        |
| **Category** | `music` (optional but recommended) |

> **Getting Your API Key:**
>
> **Option 1: Via Docker CLI (recommended)**
>
> ```bash
> docker exec tidarr cat /shared/.tidarr-api-key
> ```
>
> **Option 2: Via Tidarr Web UI**
>
> - Go to Settings → Security
> - Copy the API key displayed in the "API Key" section
>
> **If no authentication:**
>
> - Enter any value (e.g., `0000`) - it's required by Lidarr but won't be validated

4. Click **Test** to verify the connection
5. Click **Save**

> **✅ Fully Functional SABnzbd API:**
>
> - Download triggering (`addfile`)
> - Queue status tracking with real-time updates
> - Download history
> - Queue management (pause, resume, delete)

### 3. Add Tidarr as an Indexer in Lidarr

1. Go to **Settings → Indexers** in Lidarr
2. Click **+** and select **Newznab**
3. Configure the indexer with these settings:

| Setting                       | Value                                                       |
| ----------------------------- | ----------------------------------------------------------- |
| **Name**                      | Tidarr                                                      |
| **Enable RSS**                | ❌ Disabled (optional)                                      |
| **Enable Automatic Search**   | ✅ Enabled                                                  |
| **Enable Interactive Search** | ✅ Enabled                                                  |
| **URL**                       | `http://your-tidarr-url:8484`                               |
| **API Path**                  | `/api/lidarr`                                               |
| **API Key**                   | Same as download client (from step 1)                       |
| **Categories**                | `3000` (Audio), `3010` (Audio/MP3), `3040` (Audio/Lossless) |
| **Download Client**           | Select **Tidarr** (the SABnzbd client created in step 1)    |

> **Important:** Make sure to select the Tidarr download client in the "Download Client" dropdown. This ensures that when Lidarr grabs an album from this indexer, it will use the correct download client.

4. Click **Test** to verify the connection
5. Click **Save** to complete the setup


## How It Works

### Workflow

1. **Search**: Lidarr queries Tidarr indexer
2. **Results**: Tidarr searches Tidal and returns albums in Newznab format
3. **Grab**: Lidarr sends album to Tidarr download client
4. **Download**: Tidarr downloads to `/shared/nzb_downloads/{id}/` (high-quality FLAC up to 24-bit)
5. **Import**: Lidarr detects completed download and imports from `/downloads/{id}/` (same physical location)
6. **Organize**: Lidarr renames and moves files to your music library according to your settings

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                           Lidarr                            │
│                                                             │
│  ┌────────────────────┐         ┌──────────────────────┐    │
│  │  Indexer Search    │         │  Download Client     │    │
│  │   (Newznab API)    │         │   (SABnzbd API)      │    │
│  └────────┬───────────┘         └──────────┬───────────┘    │
└───────────┼────────────────────────────────┼────────────────┘
            │                                │
            │ 1. Search albums               │ 2. Grab album
            │                                │ 3. Monitor queue
            ▼                                ▼
┌─────────────────────────────────────────────────────────────┐
│                           Tidarr                            │
│                                                             │
│  ┌────────────────────┐         ┌──────────────────────┐    │
│  │ Newznab Indexer    │         │  SABnzbd Downloader  │    │
│  │  /api/lidarr       │         │   /api/sabnzbd       │    │
│  └────────┬───────────┘         └──────────┬───────────┘    │
│           │                                │                │
│           │ Query Tidal                    │ Download       │
│           ▼                                ▼                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                     Tidal API                       │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Download to
                              ▼
        ┌────────────────────────────────────────────┐
        │  /shared/nzb_downloads/{id}/ (Tidarr)      │
        │  = /downloads/{id}/ (Lidarr)               │
        │  (Shared physical folder)                  │
        └─────────────────────┬──────────────────────┘
                              │
                              │ Lidarr imports & organizes
                              ▼
             ┌──────────────────────────────────┐
             │      Music Library (/music)      │
             │   (Lidarr manages final move)    │
             └──────────────────────────────────┘
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

#### Newznab Indexer Endpoints

Tidarr implements these Newznab endpoints:

| Endpoint                                       | Purpose                      | Authentication                    |
| ---------------------------------------------- | ---------------------------- | --------------------------------- |
| `GET /api/lidarr?t=caps`                       | Returns indexer capabilities | API key via header or query param |
| `GET /api/lidarr?t=search&q=...`               | Searches for albums          | API key via header or query param |
| `GET /api/lidarr?t=music&artist=...&album=...` | Music-specific search        | API key via header or query param |
| `GET /api/lidarr/download/:id`                 | Triggers album download      | API key via header or query param |

**Authentication Methods:**

- Header: `X-Api-Key: your-api-key`
- Query param: `?apikey=your-api-key`

**Important:** The download URL returned in search results automatically includes the API key from the search request, so Lidarr can download without re-authenticating.

#### SABnzbd Download Client Endpoints

Tidarr implements these SABnzbd-compatible endpoints:

| Endpoint                                                 | Purpose                                     | Authentication          |
| -------------------------------------------------------- | ------------------------------------------- | ----------------------- |
| `GET /api/sabnzbd?mode=version`                          | Returns SABnzbd version (3.0.0)             | API key via query param |
| `GET /api/sabnzbd?mode=get_config`                       | Returns downloader configuration            | API key via query param |
| `POST /api/sabnzbd?mode=addfile`                         | Adds album to download queue via NZB upload | API key via query param |
| `GET /api/sabnzbd?mode=queue`                            | Returns current download queue status       | API key via query param |
| `GET /api/sabnzbd?mode=queue&name=delete&value=<nzo_id>` | Removes item from download queue            | API key via query param |
| `GET /api/sabnzbd?mode=history&limit=<n>`                | Returns download history (completed/failed) | API key via query param |

**Authentication:**

- All SABnzbd endpoints require `apikey` as a query parameter
- Example: `/api/sabnzbd?mode=version&apikey=your-api-key`

**Note:** These endpoints enable Lidarr to manage downloads through Tidarr as if it were a SABnzbd download client.

### Release Processing

**Lidarr-triggered downloads use minimal post-processing:**

1. **Download** via Tiddl to `/shared/nzb_downloads/{id}/`
2. **ReplayGain** applied if enabled in Tidarr settings
3. **Status** marked as completed (files stay in place)
4. **Lidarr import** handles all remaining steps (tagging, renaming, moving to `/music`)

**Tidarr UI downloads use the full pipeline:**

- Download to `/shared/.processing/{id}/`
- Beets tagging, permissions, custom scripts
- Move to `/music`
- Plex/Jellyfin scan, notifications

**Key difference:** Lidarr downloads use a dedicated path (`nzb_downloads`) and skip most Tidarr post-processing to avoid conflicts with Lidarr's own import logic. Only ReplayGain is applied before Lidarr import.

## Troubleshooting

### Lidarr doesn't detect completed downloads

**Symptom:** Downloads complete in Tidarr, but Lidarr shows them as stuck in queue or doesn't import them.

**Cause:** The shared download volume is not properly mounted in both containers.

**Solution:**

1. Verify both containers have access to the same shared download path:

```bash
# Check Tidarr (should show download folders)
docker exec tidarr ls -la /shared/nzb_downloads

# Check Lidarr (should show the same folders)
docker exec lidarr ls -la /downloads
```

2. Ensure your Docker Compose has matching volume mounts:

```yaml
services:
  tidarr:
    volumes:
      - ...
      - /path/to/lidarr/downloads:/shared/nzb_downloads

  lidarr:
    volumes:
      - ...
      - /path/to/lidarr/downloads:/downloads  # Same physical folder
```

3. Verify the paths point to the same physical location:

```bash
# Both should show the same content
ls -la /path/to/lidarr/downloads
```

4. Restart both containers after fixing volume mounts.

### Downloads fail with authentication errors

**Symptom:** Lidarr shows authentication errors when trying to download from Tidarr.

**Cause:** API key mismatch between indexer and download client configurations.

**Solution:**

1. Get the correct API key:
   ```bash
   docker exec tidarr cat /shared/.tidarr-api-key
   ```

2. Update both:
   - Lidarr Indexer settings (Settings → Indexers → Tidarr)
   - Lidarr Download Client settings (Settings → Download Clients → Tidarr)

3. Test both connections in Lidarr.

### No search results from Tidarr

**Symptom:** Lidarr searches return 0 results from Tidarr indexer.

**Possible causes and solutions:**

1. **Album not on Tidal**: Search manually on Tidal to verify availability
2. **Tidal authentication expired**: Check Tidarr settings → Tidal authentication
3. **API key invalid**: Verify indexer API key in Lidarr matches Tidarr
4. **Network issues**: Check Tidarr logs for connection errors


## Resources

- [Lidarr Documentation](https://wiki.servarr.com/lidarr)
- [Newznab API Specification](https://github.com/nZEDb/nZEDb/blob/dev/docs/newznab_api_specification.txt)
