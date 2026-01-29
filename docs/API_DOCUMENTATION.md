# Tidarr API Documentation

This documentation describes how to use the Tidarr REST API to automate downloads and manage your instance.

## Table of Contents

- [Basic Configuration](#basic-configuration)
- [Authentication](#authentication)
- [Playback Endpoints](#playback-endpoints)
- [Download Endpoints](#download-endpoints)
- [Queue Management](#queue-management)
- [History Endpoints](#history-endpoints)
- [Configuration Endpoints](#configuration-endpoints)
- [Synchronization Endpoints (watch list)](#synchronization-endpoints)
- [Custom CSS Endpoints](#custom-css-endpoints)
- [Lidarr Integration](#lidarr-integration)
- [Usage Examples](#usage-examples)

---

## Basic Configuration

**API Base URL:** `http://your-host:8484`

All API endpoints (except `/api/is-auth-active`) require authentication if `ADMIN_PASSWORD` is set in your Docker configuration.

---

## Authentication

Tidarr supports two authentication methods:

### Method 1: API Key (Recommended for automation)

The API key is automatically generated on first startup and stored in `/shared/.tidarr-api-key`.

**Get your API key:**
```bash
# Via Docker
docker exec tidarr cat /shared/.tidarr-api-key

# Or via Web UI: Settings → Authentication → API Key
```

**Use it in requests:**
```bash
# Via header (recommended)
curl http://localhost:8484/api/settings \
  -H "X-Api-Key: your-api-key"

# Via query parameter
curl "http://localhost:8484/api/settings?apikey=your-api-key"
```

**Advantages:**
- ✅ Secure random 64-character key
- ✅ No expiration (unlike JWT tokens)
- ✅ Standard for *arr applications
- ✅ Can be regenerated anytime

**Management endpoints:**

**Get current API key** (requires JWT):
```bash
GET /api/api-key
```

**Regenerate API key** (requires JWT):
```bash
POST /api/api-key/regenerate
```
⚠️ Warning: Invalidates the current key. Update it everywhere it's used.

---

### Method 2: JWT Token (For web UI and interactive sessions)

**Login:**
```bash
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
curl http://localhost:8484/api/settings \
  -H "Authorization: Bearer your-jwt-token"
```

---

### Check if authentication is active

```bash
GET /api/is-auth-active
```

**Response:**
```json
{
  "isAuthActive": true,
  "authType": "password"
}
```

**Possible `authType` values:**
- `"password"` - Password authentication (ADMIN_PASSWORD)
- `"oidc"` - OpenID Connect authentication
- `null` - No authentication configured

**Note:** All examples below use the API key method (`X-Api-Key` header).

---

### Method 3: OpenID Connect (OIDC) Authentication

Tidarr supports OIDC authentication for integration with identity providers like Keycloak, PocketID, Authentik, etc.

**Initiate OIDC login:**
```bash
GET /api/auth/oidc/login
```

Redirects the user to the configured OIDC provider for authentication.

**OIDC callback:**
```bash
GET /api/auth/oidc/callback
```

Handles the OIDC callback and issues a JWT token. Redirects to the frontend with the token.

**Required environment variables:**
- `OIDC_ISSUER` - The URL of your OpenID Connect provider
- `OIDC_CLIENT_ID` - The client ID registered in your OIDC provider
- `OIDC_CLIENT_SECRET` - The client secret for your application
- `OIDC_REDIRECT_URI` - The callback URL (e.g., `https://your-tidarr-domain.com/api/auth/oidc/callback`)

---

## Playback Endpoints

### Generate signed streaming URL

```bash
GET /api/stream/sign/:id
```

Generates a time-limited signed URL for audio streaming.

**Parameters:**
- `id` - The Tidal track ID

**Example:**
```bash
curl http://localhost:8484/api/stream/sign/123456789 \
  -H "X-Api-Key: your-api-key"
```

**Response:**
```json
{
  "url": "/api/stream/play/123456789?exp=1234567890&sig=abc123..."
}
```

**Note:** The signed URL expires after 5 minutes.

---

### Play audio stream

```bash
GET /api/stream/play/:id?exp={expiration}&sig={signature}
```

Streams audio content with signature validation. Supports range requests for seeking.

**Parameters:**
- `id` - The Tidal track ID
- `exp` - Expiration timestamp (from signed URL)
- `sig` - Signature (from signed URL)

**Note:** This endpoint is typically called via the signed URL obtained from `/api/stream/sign/:id`.

---

## Download Endpoints

### Add an item to the download queue

**Endpoint:** `POST /api/save`

**Important:** Use full Tidal URLs (not numeric IDs).

**Supported types:** `album`, `track`, `video`, `playlist`, `mix`, `artist`, `artist_videos`, `favorite_albums`, `favorite_tracks`, `favorite_playlists`, `favorite_videos`, `favorite_artists`

#### Album

```bash
curl -X POST http://localhost:8484/api/save \
  -H "X-Api-Key: your-api-key" \
  -H 'Content-Type: application/json' \
  -d '{
    "item": {
      "url": "https://listen.tidal.com/album/251082404",
      "type": "album",
      "status": "queue"
    }
  }'
```

#### Track

```bash
curl -X POST http://localhost:8484/api/save \
  -H "X-Api-Key: your-api-key" \
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
  -H "X-Api-Key: your-api-key" \
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
  -H "X-Api-Key: your-api-key" \
  -H 'Content-Type: application/json' \
  -d '{
    "item": {
      "url": "https://listen.tidal.com/playlist/abc123-def456",
      "type": "playlist",
      "status": "queue"
    }
  }'
```

#### Mix

```bash
curl -X POST http://localhost:8484/api/save \
  -H "X-Api-Key: your-api-key" \
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
  -H "X-Api-Key: your-api-key" \
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
  -H "X-Api-Key: your-api-key" \
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
  -H "X-Api-Key: your-api-key" \
  -H 'Content-Type: application/json' \
  -d '{
    "item": {
      "type": "favorite_albums",
      "status": "queue"
    }
  }'

# Favorite tracks
curl -X POST http://localhost:8484/api/save \
  -H "X-Api-Key: your-api-key" \
  -H 'Content-Type: application/json' \
  -d '{
    "item": {
      "type": "favorite_tracks",
      "status": "queue"
    }
  }'

# Favorite playlists
curl -X POST http://localhost:8484/api/save \
  -H "X-Api-Key: your-api-key" \
  -H 'Content-Type: application/json' \
  -d '{
    "item": {
      "type": "favorite_playlists",
      "status": "queue"
    }
  }'

# Favorite videos
curl -X POST http://localhost:8484/api/save \
  -H "X-Api-Key: your-api-key" \
  -H 'Content-Type: application/json' \
  -d '{
    "item": {
      "type": "favorite_videos",
      "status": "queue"
    }
  }'

# Favorite artists
curl -X POST http://localhost:8484/api/save \
  -H "X-Api-Key: your-api-key" \
  -H 'Content-Type: application/json' \
  -d '{
    "item": {
      "type": "favorite_artists",
      "status": "queue"
    }
  }'
```

**Response:** `201 Created`

---

### Remove an item from the queue

```bash
curl -X DELETE http://localhost:8484/api/remove \
  -H "X-Api-Key: your-api-key" \
  -H 'Content-Type: application/json' \
  -d '{"id": "12345"}'
```

**Response:** `204 No Content`

---

### Clear the entire queue

```bash
curl -X DELETE http://localhost:8484/api/remove-all \
  -H "X-Api-Key: your-api-key"
```

**Response:** `204 No Content`

---

### Remove finished items

```bash
curl -X DELETE http://localhost:8484/api/remove-finished \
  -H "X-Api-Key: your-api-key"
```

**Response:** `204 No Content`

---

## Queue Management

### Pause the queue

```bash
curl -X POST http://localhost:8484/api/queue/pause \
  -H "X-Api-Key: your-api-key"
```

**Response:** `204 No Content`

**Behavior:**
- Stops processing new items
- Cancels current download and resets it to "queue" status
- Cleans up incomplete downloads

---

### Resume the queue

```bash
curl -X POST http://localhost:8484/api/queue/resume \
  -H "X-Api-Key: your-api-key"
```

**Response:** `204 No Content`

---

### Get queue status

```bash
curl http://localhost:8484/api/queue/status \
  -H "X-Api-Key: your-api-key"
```

**Response:**
```json
{
  "isPaused": false
}
```

---

## History Endpoints

**Note:** History requires `ENABLE_HISTORY=true` in Docker configuration.

### Get download history

```bash
curl http://localhost:8484/api/history/list \
  -H "X-Api-Key: your-api-key"
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

---

### Clear history

```bash
curl -X DELETE http://localhost:8484/api/history/list \
  -H "X-Api-Key: your-api-key"
```

**Response:** `204 No Content`

---

## Configuration Endpoints

### Get Tidarr configuration

```bash
curl http://localhost:8484/api/settings \
  -H "X-Api-Key: your-api-key"
```

**Response:**
```json
{
  "noToken": false,
  "quality": "high",
  "enableBeetsAutotag": true,
  "enablePlexUpdate": true,
  "tiddl_config": {
    "auth": {
      "token": "...",
      "refresh_token": "..."
    },
    "format": {
      "quality": "high",
      "album_template": "{album_artist}/{album}/{number:02d}. {title}"
    }
  }
}
```

---

### Delete Tidal token

```bash
curl -X DELETE http://localhost:8484/api/token \
  -H "X-Api-Key: your-api-key"
```

**Response:** `204 No Content`

---

### Get Tiddl TOML configuration

```bash
curl http://localhost:8484/api/tiddl/config \
  -H "X-Api-Key: your-api-key"
```

**Response:**
```json
{
  "toml": "[download]\nquality = \"high\"\nthreads = 6\n..."
}
```

---

### Save Tiddl TOML configuration

```bash
curl -X POST http://localhost:8484/api/tiddl/config \
  -H "X-Api-Key: your-api-key" \
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

## Synchronization Endpoints

### Get synchronized playlists

```bash
curl http://localhost:8484/api/sync/list \
  -H "X-Api-Key: your-api-key"
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

---

### Add playlist to sync

```bash
curl -X POST http://localhost:8484/api/sync/save \
  -H "X-Api-Key: your-api-key" \
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

**Response:** `201 Created`

---

### Remove playlist from sync

```bash
curl -X DELETE http://localhost:8484/api/sync/remove \
  -H "X-Api-Key: your-api-key" \
  -H 'Content-Type: application/json' \
  -d '{"id": "abc123-def456"}'
```

**Response:** `204 No Content`

---

### Remove all playlists from sync

```bash
curl -X DELETE http://localhost:8484/api/sync/remove-all \
  -H "X-Api-Key: your-api-key"
```

**Response:** `204 No Content`

---

### Trigger sync now

```bash
curl -X POST http://localhost:8484/api/sync/trigger \
  -H "X-Api-Key: your-api-key"
```

**Response:** `202 Accepted`

**Note:** Default sync schedule is `0 3 * * *` (3 AM daily). Configure with `SYNC_CRON_EXPRESSION`.

---

## Custom CSS Endpoints

### Get custom CSS

```bash
curl http://localhost:8484/api/custom-css \
  -H "X-Api-Key: your-api-key"
```

**Response:**
```json
{
  "css": "body { background-color: #1a1a1a; }"
}
```

---

### Save custom CSS

```bash
curl -X POST http://localhost:8484/api/custom-css \
  -H "X-Api-Key: your-api-key" \
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

## Lidarr Integration

Tidarr integrates with Lidarr using:
1. **Newznab Indexer** - Search and discover albums
2. **SABnzbd Download Client** - Track downloads

**📖 Complete setup guide:** [LIDARR_INTEGRATION.md](LIDARR_INTEGRATION.md)

---

### Newznab Indexer Endpoints

Base URL: `http://your-tidarr-url:8484/api/lidarr`

#### Get Capabilities

```bash
GET /api/lidarr?t=caps
```

**Example:**
```bash
curl "http://localhost:8484/api/lidarr?t=caps&apikey=your-api-key"
```

**Response:** XML capabilities document

---

#### Search Albums

```bash
GET /api/lidarr?t=search&q={query}
GET /api/lidarr?t=music&artist={artist}&album={album}
```

**Parameters:**
- `t` - Request type: `search` or `music`
- `q` - Search query
- `artist` - Artist name (for `t=music`)
- `album` - Album name (for `t=music`)

**Examples:**
```bash
# General search
curl "http://localhost:8484/api/lidarr?t=search&q=Daft%20Punk&apikey=your-api-key"

# Artist + Album search
curl "http://localhost:8484/api/lidarr?t=music&artist=Daft%20Punk&album=Random%20Access%20Memories&apikey=your-api-key"
```

**Response:** Newznab XML with results

---

#### Download Album

```bash
GET /api/lidarr/download/{albumId}/{quality}
```

**Parameters:**
- `albumId` - The Tidal album ID
- `quality` - Download quality: `max` (24-bit), `high` (16-bit), `normal` (AAC-320), `low` (AAC-96)

**Example:**
```bash
curl "http://localhost:8484/api/lidarr/download/34277251/high?apikey=your-api-key"
```

**Response:** NZB file format

---

### SABnzbd Download Client Endpoints

Base URL: `http://your-tidarr-url:8484/api/sabnzbd/api`

#### Get Version

```bash
GET /api/sabnzbd/api?mode=version
```

**Example:**
```bash
curl "http://localhost:8484/api/sabnzbd/api?mode=version&apikey=your-api-key"
```

**Response:**
```json
{
  "version": "3.0.0"
}
```

---

#### Add Download

```bash
GET /api/sabnzbd/api?mode=addurl&name={url}
POST /api/sabnzbd/api?mode=addfile  # multipart/form-data with NZB file
```

**Example:**
```bash
curl "http://localhost:8484/api/sabnzbd/api?mode=addurl&name=https://listen.tidal.com/album/34277251&apikey=your-api-key"
```

**Response:**
```json
{
  "status": true,
  "nzo_ids": ["tidarr-34277251-1234567890"]
}
```

---

#### Get Queue

```bash
GET /api/sabnzbd/api?mode=queue
```

**Example:**
```bash
curl "http://localhost:8484/api/sabnzbd/api?mode=queue&apikey=your-api-key"
```

**Response:**
```json
{
  "queue": {
    "status": "Downloading",
    "slots": [
      {
        "nzo_id": "tidarr-34277251-1234567890",
        "filename": "Daft Punk - Random Access Memories",
        "status": "Downloading"
      }
    ]
  }
}
```

**Status mapping:**
- `Downloading` - Currently processing
- `Queued` - Waiting in queue
- `Paused` - Queue paused

---

#### Delete from Queue

```bash
GET /api/sabnzbd/api?mode=queue&name=delete&value={nzo_id}
```

**Example:**
```bash
curl "http://localhost:8484/api/sabnzbd/api?mode=queue&name=delete&value=tidarr_nzo_34277251&apikey=your-api-key"
```

**Response:**
```json
{
  "status": true,
  "nzo_ids": ["tidarr_nzo_34277251"]
}
```

---

#### Get History

```bash
GET /api/sabnzbd/api?mode=history&limit={n}
```

**Example:**
```bash
curl "http://localhost:8484/api/sabnzbd/api?mode=history&limit=50&apikey=your-api-key"
```

**Response:**
```json
{
  "history": {
    "slots": [
      {
        "nzo_id": "tidarr-34277251-1234567890",
        "name": "Daft Punk - Random Access Memories",
        "status": "Completed",
        "storage": "/music/Daft Punk/2013 - Random Access Memories"
      }
    ]
  }
}
```

**Status mapping:**
- `Completed` - Successfully downloaded
- `Failed` - Download failed

---

#### Delete from History

```bash
GET /api/sabnzbd/api?mode=history&name=delete&value={nzo_id}
```

**Example:**
```bash
curl "http://localhost:8484/api/sabnzbd/api?mode=history&name=delete&value=tidarr_nzo_34277251&apikey=your-api-key"
```

**Response:**
```json
{
  "status": true,
  "nzo_ids": ["tidarr_nzo_34277251"]
}
```

---

## Usage Examples

### Bash: Download multiple albums

```bash
#!/bin/bash

TIDARR_URL="http://localhost:8484"
TIDARR_API_KEY=$(docker exec tidarr cat /shared/.tidarr-api-key)

albums=(
  "https://listen.tidal.com/album/251082404"
  "https://listen.tidal.com/album/123456789"
)

for album in "${albums[@]}"; do
  echo "Adding $album..."
  curl -s -X POST $TIDARR_URL/api/save \
    -H "X-Api-Key: $TIDARR_API_KEY" \
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
```

---

### Python: Add to queue

```python
#!/usr/bin/env python3
import requests

TIDARR_URL = "http://localhost:8484"
API_KEY = "your-api-key"

headers = {"X-Api-Key": API_KEY}

album_data = {
    "item": {
        "url": "https://listen.tidal.com/album/251082404",
        "type": "album",
        "status": "queue"
    }
}

requests.post(f"{TIDARR_URL}/api/save", headers=headers, json=album_data)
print("Album added to queue")
```

---

### Docker: Direct download

```bash
docker compose exec tidarr tiddl download url https://listen.tidal.com/album/251082404
```

---

## HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `202 Accepted` - Async operation accepted
- `204 No Content` - Deletion successful
- `400 Bad Request` - Invalid data
- `403 Forbidden` - Invalid API key/token
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

*Part of this documentation was generated with AI assistance* 
