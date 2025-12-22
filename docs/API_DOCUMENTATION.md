# Tidarr API Documentation

This documentation describes how to use the Tidarr REST API with curl to automate downloads and manage your instance.

## Table of Contents

- [Basic Configuration](#basic-configuration)
- [Authentication](#authentication)
- [API Key Management](#api-key-management)
- [Download Endpoints](#download-endpoints)
- [History Endpoints](#history-endpoints)
- [Configuration Endpoints](#configuration-endpoints)
- [Synchronization Endpoints](#synchronization-endpoints)
- [Custom CSS Endpoints](#custom-css-endpoints)
- [Lidarr Integration](#lidarr-integration-newznab-indexer)
- [Usage Examples](#usage-examples)

---

## Basic Configuration

API base URL: `http://your-host:8484`

All API endpoints (except `/api/is-auth-active`) require authentication if `ADMIN_PASSWORD` is set in your Docker configuration.

---

## Authentication

Tidarr supports two authentication methods for API access:

### 🔑 Recommended: API Key (X-Api-Key header)

The API key is automatically generated on first startup and stored in `/shared/.tidarr-api-key`.

```bash
# Get your API key
export TIDARR_API_KEY=$(docker exec tidarr cat /shared/.tidarr-api-key)

# Use it in requests
curl http://localhost:8484/api/settings \
  -H "X-Api-Key: $TIDARR_API_KEY"
```

**Advantages:**
- ✅ Secure random key (64 hex characters)
- ✅ Separate from your admin password
- ✅ Can be regenerated anytime
- ✅ Standard *arr protocol
- ✅ No expiration (unlike JWT tokens)

**Alternative:** API key can also be sent via query parameter (not recommended for production):
```bash
curl "http://localhost:8484/api/settings?apikey=$TIDARR_API_KEY"
```

📖 See [API Key Documentation](API_KEY.md) for complete guide.

---

### 🔐 Alternative: JWT Token (Bearer authentication)

**Best for:** Web UI, interactive sessions

If authentication is active, you can obtain a JWT token:

```bash
# Login
curl -X POST http://localhost:8484/api/auth \
  -H 'Content-Type: application/json' \
  -d '{"password": "your_password"}'
```

**Response:**
```json
{
  "status": "ok",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Use the token:**
```bash
export TIDARR_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl http://localhost:8484/api/settings \
  -H "X-Api-Key: $TIDARR_API_KEY"
```

**Note:** JWT tokens are primarily used by the web UI. For automation and scripts, **prefer the API key method**.

---

### Check if authentication is active

```bash
curl http://localhost:8484/api/is-auth-active
```

**Response:**
```json
{
  "isAuthActive": true
}
```

---

## API Key Management

These endpoints allow you to retrieve and regenerate your API key programmatically.

### Get current API key

**Endpoint:** `GET /api/api-key`

**Authentication:** Requires JWT token (web UI login)

```bash
# Login first to get JWT token
TOKEN=$(curl -s -X POST http://localhost:8484/api/auth \
  -H 'Content-Type: application/json' \
  -d '{"password": "your_password"}' | jq -r '.token')

# Get API key
curl http://localhost:8484/api/api-key \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "apiKey": "9a72222ec7eb4e96b5f33fe2b93b6fc5d1e8f4a3b6c9d0e7f2a5b8c1d4e7f0a3"
}
```

**Fields:**
- `apiKey`: Your current API key (use this in *arr apps like Lidarr)

### Regenerate API key

**Endpoint:** `POST /api/api-key/regenerate`

**Authentication:** Requires JWT token (web UI login)

⚠️ **Warning:** This will invalidate your current API key. You'll need to update it in all applications using it (Lidarr, scripts, etc.).

```bash
curl -X POST http://localhost:8484/api/api-key/regenerate \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "apiKey": "1f8b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b"
}
```

📖 For complete API key documentation, see [API_KEY.md](API_KEY.md)

---

## Download Endpoints

### Add an item to the download queue

**Endpoint:** `POST /api/save`

**Important:** The API uses full Tidal URLs (not numeric IDs).

### Lidarr Integration (Newznab Indexer)

Tidarr implements the **Newznab protocol** for seamless integration with Lidarr. This allows Lidarr to search and download albums from Tidal's catalog automatically.

**Base URL:** `http://your-tidarr-url:8484/api/lidarr`

#### Setup in Lidarr

1. **Go to Settings → Indexers** in Lidarr
2. **Click +** and select **Newznab**
3. **Configure the indexer:**
   - **Name:** Tidarr
   - **Enable RSS:** ❌ Disabled (optional)
   - **Enable Automatic Search:** ✅ Enabled
   - **Enable Interactive Search:** ✅ Enabled
   - **URL:** `http://your-tidarr-url:8484`
   - **API Path:** `/api/lidarr`
   - **API Key:** Get from Tidarr (see below)
   - **Categories:** Select `3000` (Audio), `3010` (Audio/MP3), `3040` (Audio/Lossless)
4. **Click Test** to verify the connection
5. **Save** the configuration

**Getting Your API Key:**
```bash
# Via Docker CLI
docker exec tidarr cat /shared/.tidarr-api-key

# Or via Tidarr Web UI: Settings → Authentication → API Key
```

**Note:** If authentication is not enabled, leave the API Key field empty.

#### Supported Newznab Endpoints

##### 1. Get Capabilities

**Endpoint:** `GET /api/lidarr?t=caps`

Returns the indexer capabilities in XML format. This is called by Lidarr to determine what the indexer supports.

**Authentication:** Supports API key via header or query parameter

**Examples:**
```bash
# Using X-Api-Key header
curl -H "X-Api-Key: your-api-key" "http://localhost:8484/api/lidarr?t=caps"

# Using query parameter
curl "http://localhost:8484/api/lidarr?t=caps&apikey=your-api-key"

# Without authentication (if not required)
curl "http://localhost:8484/api/lidarr?t=caps"
```

**Response:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<caps>
  <server version="1.0" title="Tidarr" strapline="Tidal Music Indexer" email="tidarr@tidarr.com" url="http://localhost:8484" image="http://localhost:8484/logo.png"/>
  <limits max="100" default="100"/>
  <registration available="no" open="no"/>
  <searching>
    <search available="yes" supportedParams="q"/>
    <music-search available="yes" supportedParams="q,artist,album"/>
    <audio-search available="yes" supportedParams="q,artist,album"/>
  </searching>
  <categories>
    <category id="3000" name="Audio">
      <subcat id="3010" name="MP3"/>
      <subcat id="3040" name="Lossless"/>
      <subcat id="3050" name="Other"/>
    </category>
  </categories>
</caps>
```

##### 2. Search for Albums

**Endpoint:** `GET /api/lidarr?t=search&q={query}`

Search Tidal's catalog using a query string.

**Authentication:** Supports API key via header or query parameter

**Parameters:**
- `t` - Request type: `search`, `music-search`, or `audio-search`
- `q` - Search query (e.g., "Daft Punk Random Access Memories")
- `artist` - Artist name (optional)
- `album` - Album name (optional)
- `apikey` - API key (if using query parameter authentication)

**Examples:**
```bash
# Using X-Api-Key header
curl -H "X-Api-Key: your-api-key" \
  "http://localhost:8484/api/lidarr?t=search&q=Daft%20Punk%20Random%20Access%20Memories"

# Using query parameter
curl "http://localhost:8484/api/lidarr?t=search&q=Daft%20Punk&apikey=your-api-key"

# Without authentication (if not required)
curl "http://localhost:8484/api/lidarr?t=search&q=Pennywise"
```

**Response:** Newznab XML format with matching albums. Each item includes a download URL with the API key embedded (if provided in the search request).

##### 3. Download Album (Grab)

**Endpoint:** `GET /api/lidarr/download/{albumId}`

Trigger the download of a specific album and add it to Tidarr's queue.

**Authentication:** Supports API key via header or query parameter

**Important:** When Lidarr searches for albums, the download URLs in the search results automatically include the API key that was used for the search. This ensures Lidarr can download without re-authentication issues.

**Examples:**
```bash
# Using X-Api-Key header
curl -H "X-Api-Key: your-api-key" \
  "http://localhost:8484/api/lidarr/download/34277251"

# Using query parameter (automatically added by search results)
curl "http://localhost:8484/api/lidarr/download/34277251?apikey=your-api-key"
```

**Response:** NZB file format (required by Lidarr protocol)

##### 4. Check Download Status

**Endpoint:** `GET /api/lidarr/status/{albumId}`

Check if an album has been successfully queued for download.

**Example:**
```bash
curl "http://localhost:8484/api/lidarr/status/34277251"
```

**Response:**
```json
{
  "status": "queued",
  "message": "Album is in download queue",
  "item": {
    "id": "lidarr-34277251-1234567890",
    "artist": "Daft Punk",
    "title": "Random Access Memories",
    "type": "album",
    "status": "queue",
    "quality": "max",
    "url": "album/34277251"
  }
}
```

#### Advanced Features

**Smart Query Parsing:**
- Automatically detects artist/album from queries like "Artist - Album"
- Handles various delimiters: " - ", " – ", ": ", " : "
- Falls back to midpoint splitting for queries without delimiters

**Album Edition Detection:**
- Identifies different editions: Standard, Deluxe, Remastered, Anniversary, etc.
- Prioritizes Standard editions (score: 100) over special editions
- Removes duplicate albums, keeping only the highest priority version

**Quality Mapping:**
- `low` → MP3-96 (M4A 96kbps)
- `normal` → AAC-320 (M4A 320kbps)
- `high` → FLAC (FLAC 16-bit 44.1kHz)
- `max` → FLAC 24bit (FLAC 24-bit 192kHz)

**MusicBrainz Compatibility:**
- Formats artist and album names according to MusicBrainz guidelines
- Applies proper title case formatting
- Handles common words (the, of, and, etc.) appropriately

#### Error Handling

**Invalid API Key (403 Forbidden):**
```json
{
  "error": true,
  "message": "Invalid API key"
}
```

**Token Required (403 Forbidden):**
```json
{
  "error": true,
  "message": "Token required"
}
```

**Album Not Found:**
```json
{
  "error": "Failed to fetch album details from Tidal",
  "tidalStatus": 404,
  "tidalStatusText": "Not Found"
}
```

**Empty Search Results:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Tidarr</title>
    <newznab:response offset="0" total="0"/>
  </channel>
</rss>
```

**How matching works:**
- Searches Tidal with artist name + album title
- Compares results using similarity scoring:
  - Artist name: 40%
  - Album title: 50%
  - Release year: 10%
- Returns best match if score is above 60% threshold
- Logs all candidates with scores for debugging

#### Album

```bash
curl -X POST http://localhost:8484/api/save \
  -H "X-Api-Key: $TIDARR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "item": {
      "url": "https://listen.tidal.com/album/251082404",
      "type": "album",
      "status": "queue"
    }
  }'
```

#### Track (single song)

```bash
curl -X POST http://localhost:8484/api/save \
  -H "X-Api-Key: $TIDARR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "item": {
      "url": "https://listen.tidal.com/track/123456789",
      "type": "track",
      "status": "queue"
    }
  }'
```

#### Video

```bash
curl -X POST http://localhost:8484/api/save \
  -H "X-Api-Key: $TIDARR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "item": {
      "url": "https://listen.tidal.com/video/123456789",
      "type": "video",
      "status": "queue"
    }
  }'
```

#### Playlist

```bash
curl -X POST http://localhost:8484/api/save \
  -H "X-Api-Key: $TIDARR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "item": {
      "url": "https://listen.tidal.com/playlist/abc123-def456",
      "type": "playlist",
      "status": "queue"
    }
  }'
```

#### Mix Tidal

```bash
curl -X POST http://localhost:8484/api/save \
  -H "X-Api-Key: $TIDARR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "item": {
      "url": "https://listen.tidal.com/mix/000000000000000000000000",
      "type": "mix",
      "status": "queue"
    }
  }'
```

#### Artist (all albums)

```bash
curl -X POST http://localhost:8484/api/save \
  -H "X-Api-Key: $TIDARR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "item": {
      "url": "https://listen.tidal.com/artist/3566315",
      "type": "artist",
      "status": "queue"
    }
  }'
```

#### Artist (all videos)

```bash
curl -X POST http://localhost:8484/api/save \
  -H "X-Api-Key: $TIDARR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "item": {
      "url": "https://listen.tidal.com/artist/3566315",
      "type": "artist_videos",
      "status": "queue"
    }
  }'
```

#### Favorites

```bash
# Favorite albums
curl -X POST http://localhost:8484/api/save \
  -H "X-Api-Key: $TIDARR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "item": {
      "type": "favorite_albums",
      "status": "queue"
    }
  }'

# Favorite tracks
curl -X POST http://localhost:8484/api/save \
  -H "X-Api-Key: $TIDARR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "item": {
      "type": "favorite_tracks",
      "status": "queue"
    }
  }'

# Favorite playlists
curl -X POST http://localhost:8484/api/save \
  -H "X-Api-Key: $TIDARR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "item": {
      "type": "favorite_playlists",
      "status": "queue"
    }
  }'

# Favorite videos
curl -X POST http://localhost:8484/api/save \
  -H "X-Api-Key: $TIDARR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "item": {
      "type": "favorite_videos",
      "status": "queue"
    }
  }'

# Favorite artists
curl -X POST http://localhost:8484/api/save \
  -H "X-Api-Key: $TIDARR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "item": {
      "type": "favorite_artists",
      "status": "queue"
    }
  }'
```

**Response:** Status `201 Created`

### Remove an item from the queue

```bash
curl -X DELETE http://localhost:8484/api/remove \
  -H "X-Api-Key: $TIDARR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"id": "12345"}'
```

**Response:** Status `204 No Content`

### Clear the entire download queue

```bash
curl -X DELETE http://localhost:8484/api/remove-all \
  -H "X-Api-Key: $TIDARR_API_KEY"
```

**Response:** Status `204 No Content`

### Remove finished items

```bash
curl -X DELETE http://localhost:8484/api/remove-finished \
  -H "X-Api-Key: $TIDARR_API_KEY"
```

**Response:** Status `204 No Content`

### Pause the download queue

Pauses the download queue. If an item is currently being processed, it will be cancelled and returned to the queue with status "queue". Queued items will not start processing until the queue is resumed.

```bash
curl -X POST http://localhost:8484/api/queue/pause \
  -H "X-Api-Key: $TIDARR_API_KEY"
```

**Response:** Status `204 No Content`

**Behavior:**
- Stops processing of new items from the queue
- Cancels the currently processing item (if any) and resets it to "queue" status
- Cleans up incomplete downloads
- Items can be added to the queue while paused, but won't process until resumed

### Resume the download queue

Resumes the download queue after it has been paused.

```bash
curl -X POST http://localhost:8484/api/queue/resume \
  -H "X-Api-Key: $TIDARR_API_KEY"
```

**Response:** Status `204 No Content`

### Get queue status

Returns the current status of the download queue (paused or active).

```bash
curl http://localhost:8484/api/queue/status \
  -H "X-Api-Key: $TIDARR_API_KEY"
```

**Response:**
```json
{
  "isPaused": false
}
```

---

## History Endpoints

The history feature tracks downloaded items. It can be enabled by setting `ENABLE_HISTORY=true` in your Docker configuration.

### Get download history

Returns the list of all downloaded items.

```bash
curl http://localhost:8484/api/history/list \
  -H "X-Api-Key: $TIDARR_API_KEY"
```

**Response:**
```json
[
  {
    "id": "251082404",
    "type": "album",
    "url": "https://listen.tidal.com/album/251082404",
    "title": "Album Name",
    "downloadedAt": 1234567890
  }
]
```

**Note:** History is only available when `ENABLE_HISTORY=true` is set in your environment variables.

### Clear download history

Removes all items from the download history.

```bash
curl -X DELETE http://localhost:8484/api/history/list \
  -H "X-Api-Key: $TIDARR_API_KEY"
```

**Response:** Status `204 No Content`

**Behavior:**
- Deletes the entire download history
- Does not affect the current download queue
- Only clears the history tracking, does not delete downloaded files

---

## Configuration Endpoints

### Get Tidarr configuration

```bash
curl http://localhost:8484/api/settings \
  -H "X-Api-Key: $TIDARR_API_KEY"
```

**Response:**
```json
{
  "noToken": false,
  "quality": "high",
  "enableBeetsAutotag": true,
  "enablePlexUpdate": true,
  "enableGotify": false,
  "enableAppriseApi": false,
  "tiddl_config": {
    "auth": {
      "token": "...",
      "refresh_token": "...",
      "token_expiry": "..."
    },
    "format": {
      "quality": "high",
      "album_template": "{album_artist}/{album}/{number:02d}. {title}",
      "track_template": "{artist}/_tracks/{artist} - {title}",
      "video_template": "_videos/{artist}/{artist} - {title}",
      "playlist_template": "_playlists/{playlist}/{playlist_number:02d}. {artist} - {title}"
    }
  }
}
```

### Delete Tidal token

```bash
curl -X DELETE http://localhost:8484/api/token \
  -H "X-Api-Key: $TIDARR_API_KEY"
```

**Response:** Status `204 No Content`

---

## Synchronization Endpoints

Synchronization allows automatic downloading of new songs from a playlist according to a cron schedule.

### Get synchronized playlists list

```bash
curl http://localhost:8484/api/sync/list \
  -H "X-Api-Key: $TIDARR_API_KEY"
```

**Response:**
```json
[
  {
    "id": "abc123-def456",
    "title": "My Playlist",
    "url": "https://listen.tidal.com/playlist/abc123-def456",
    "type": "playlist"
  }
]
```

### Add a playlist to synchronization

```bash
curl -X POST http://localhost:8484/api/sync/save \
  -H "X-Api-Key: $TIDARR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "item": {
      "id": "abc123-def456",
      "title": "My Playlist",
      "url": "https://listen.tidal.com/playlist/abc123-def456",
      "type": "playlist"
    }
  }'
```

**Response:** Status `201 Created`

### Remove a playlist from synchronization

```bash
curl -X DELETE http://localhost:8484/api/sync/remove \
  -H "X-Api-Key: $TIDARR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"id": "abc123-def456"}'
```

**Response:** Status `204 No Content`

### Sync all items now

Manually trigger synchronization of all items in the watch list (instead of waiting for the cron schedule):

```bash
curl -X POST http://localhost:8484/api/sync/trigger \
  -H "X-Api-Key: $TIDARR_API_KEY"
```

**Response:** Status `202 Accepted`

This endpoint will immediately queue all items from the watch list for download. Items already in the queue with status "processing" will be skipped. Items with status "finished" will be removed from the queue and re-added.

**Note:** The synchronization cron is configured via the `SYNC_CRON_EXPRESSION` environment variable (default: `0 3 * * *` = every day at 3 AM).

---

## Custom CSS Endpoints

### Get custom CSS

```bash
curl http://localhost:8484/api/custom-css \
  -H "X-Api-Key: $TIDARR_API_KEY"
```

**Response:**
```json
{
  "css": "body { background-color: #1a1a1a; }"
}
```

### Save custom CSS

```bash
curl -X POST http://localhost:8484/api/custom-css \
  -H "X-Api-Key: $TIDARR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "css": "body { background-color: #1a1a1a; }"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Custom CSS saved successfully"
}
```

---

## Tiddl Configuration Endpoints

### Get Tiddl TOML configuration

Retrieve the current Tiddl configuration file (config.toml):

```bash
curl http://localhost:8484/api/tiddl/config \
  -H "X-Api-Key: $TIDARR_API_KEY"
```

**Response:**
```json
{
  "toml": "[download]\nquality = \"high\"\nthreads = 6\n..."
}
```

### Save Tiddl TOML configuration

Update the Tiddl configuration file:

```bash
curl -X POST http://localhost:8484/api/tiddl/config \
  -H "X-Api-Key: $TIDARR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "toml": "[download]\nquality = \"max\"\nthreads = 8\n..."
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Tiddl config saved successfully"
}
```

---

## Usage Examples

### Bash script to download multiple albums

```bash
#!/bin/bash

# Configuration
TIDARR_URL="http://localhost:8484"
TIDARR_PASSWORD="your_password"

# Get JWT token
TOKEN=$(curl -s -X POST $TIDARR_URL/api/auth \
  -H 'Content-Type: application/json' \
  -d "{\"password\": \"$TIDARR_PASSWORD\"}" | jq -r '.token')

# List of albums to download
albums=(
  "https://listen.tidal.com/album/251082404"
  "https://listen.tidal.com/album/123456789"
  "https://listen.tidal.com/album/987654321"
)

# Add each album to the queue
for album in "${albums[@]}"; do
  echo "Adding $album..."
  curl -s -X POST $TIDARR_URL/api/save \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d "{
      \"item\": {
        \"url\": \"$album\",
        \"type\": \"album\",
        \"status\": \"queue\"
      }
    }"
  echo " ✓"
done

echo "All albums have been added to the download queue!"
```

### Python script to add items to the queue

```python
#!/usr/bin/env python3
import requests
import json
import time

TIDARR_URL = "http://localhost:8484"
PASSWORD = "your_password"

# Authentication
auth_response = requests.post(
    f"{TIDARR_URL}/api/auth",
    json={"password": PASSWORD}
)
token = auth_response.json()["token"]
headers = {"Authorization": f"Bearer {token}"}

# Add an album
album_data = {
    "item": {
        "url": "https://listen.tidal.com/album/251082404",
        "type": "album",
        "status": "queue"
    }
}
requests.post(
    f"{TIDARR_URL}/api/save",
    headers=headers,
    json=album_data
)

print("Album added to download queue")
```

### Use Docker CLI to download directly

If you prefer to download directly without going through the download queue:

```bash
docker compose exec tidarr tiddl url https://listen.tidal.com/album/251082404 download
```

---

## Important Notes

1. **Data format**: The API expects a full Tidal URL, not a numeric ID alone.

2. **Supported types**: `album`, `track`, `video`, `playlist`, `mix`, `artist`, `artist_videos`, `favorite_albums`, `favorite_tracks`, `favorite_playlists`, `favorite_videos`, `favorite_artists`

3. **Authentication**: If `ADMIN_PASSWORD` is not set in your Docker configuration, authentication is not required.

4. **Status**: When adding an item, always use `"status": "queue"`.

5. **SSE Endpoints**: The `/api/stream-processing` and `/api/stream-item-output/:id` endpoints use Server-Sent Events (SSE) for real-time updates. They are not intended to be used with curl, but rather with EventSource JavaScript clients or SSE libraries.

---

## HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` - Deletion successful
- `400 Bad Request` - Invalid data
- `403 Forbidden` - Missing or invalid token
- `500 Internal Server Error` - Server error

---

*Some part of this documentation was generated by AI*
