# Tidarr API Documentation

This documentation describes how to use the Tidarr REST API with curl to automate downloads and manage your instance.

## Table of Contents

- [Basic Configuration](#basic-configuration)
- [Authentication](#authentication)
- [Download Endpoints](#download-endpoints)
- [Configuration Endpoints](#configuration-endpoints)
- [Synchronization Endpoints](#synchronization-endpoints)
- [Custom CSS Endpoints](#custom-css-endpoints)
- [Usage Examples](#usage-examples)

---

## Basic Configuration

API base URL: `http://your-host:8484`

All API endpoints (except `/api/is_auth_active`) require authentication if `ADMIN_PASSWORD` is set in your Docker configuration.

---

## Authentication

### Check if authentication is active

```bash
curl http://localhost:8484/api/is_auth_active
```

**Response:**
```json
{
  "isAuthActive": true
}
```

### Login and get a JWT token

If authentication is active, you must first obtain a JWT token:

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

**Use the token for subsequent requests:**

```bash
export TIDARR_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl http://localhost:8484/api/check \
  -H "Authorization: Bearer $TIDARR_TOKEN"
```

---

## Download Endpoints

### Add an item to the download queue

**Endpoint:** `POST /api/save`

**Important:** The API uses full Tidal URLs (not numeric IDs).

#### Album

```bash
curl -X POST http://localhost:8484/api/save \
  -H "Authorization: Bearer $TIDARR_TOKEN" \
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
  -H "Authorization: Bearer $TIDARR_TOKEN" \
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
  -H "Authorization: Bearer $TIDARR_TOKEN" \
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
  -H "Authorization: Bearer $TIDARR_TOKEN" \
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
  -H "Authorization: Bearer $TIDARR_TOKEN" \
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
  -H "Authorization: Bearer $TIDARR_TOKEN" \
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
  -H "Authorization: Bearer $TIDARR_TOKEN" \
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
  -H "Authorization: Bearer $TIDARR_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "item": {
      "type": "favorite_albums",
      "status": "queue"
    }
  }'

# Favorite tracks
curl -X POST http://localhost:8484/api/save \
  -H "Authorization: Bearer $TIDARR_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "item": {
      "type": "favorite_tracks",
      "status": "queue"
    }
  }'

# Favorite playlists
curl -X POST http://localhost:8484/api/save \
  -H "Authorization: Bearer $TIDARR_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "item": {
      "type": "favorite_playlists",
      "status": "queue"
    }
  }'
```

**Response:** Status `201 Created`

### Remove an item from the queue

```bash
curl -X DELETE http://localhost:8484/api/remove \
  -H "Authorization: Bearer $TIDARR_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"id": "12345"}'
```

**Response:** Status `204 No Content`

### Clear the entire download queue

```bash
curl -X DELETE http://localhost:8484/api/remove_all \
  -H "Authorization: Bearer $TIDARR_TOKEN"
```

**Response:** Status `204 No Content`

### Remove finished items

```bash
curl -X DELETE http://localhost:8484/api/remove_finished \
  -H "Authorization: Bearer $TIDARR_TOKEN"
```

**Response:** Status `204 No Content`

---

## Configuration Endpoints

### Get Tidarr configuration

```bash
curl http://localhost:8484/api/check \
  -H "Authorization: Bearer $TIDARR_TOKEN"
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
curl http://localhost:8484/api/delete_token \
  -H "Authorization: Bearer $TIDARR_TOKEN"
```

**Response:** Status `201 Created`

---

## Synchronization Endpoints

Synchronization allows automatic downloading of new songs from a playlist according to a cron schedule.

### Get synchronized playlists list

```bash
curl http://localhost:8484/api/sync/list \
  -H "Authorization: Bearer $TIDARR_TOKEN"
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
  -H "Authorization: Bearer $TIDARR_TOKEN" \
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
curl -X POST http://localhost:8484/api/sync/remove \
  -H "Authorization: Bearer $TIDARR_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"id": "abc123-def456"}'
```

**Response:** Status `201 Created`

**Note:** The synchronization cron is configured via the `SYNC_CRON_EXPRESSION` environment variable (default: `0 3 * * *` = every day at 3 AM).

---

## Custom CSS Endpoints

### Get custom CSS

```bash
curl http://localhost:8484/api/custom-css \
  -H "Authorization: Bearer $TIDARR_TOKEN"
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
  -H "Authorization: Bearer $TIDARR_TOKEN" \
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

2. **Supported types**: `album`, `track`, `video`, `playlist`, `mix`, `artist`, `artist_videos`, `favorite_albums`, `favorite_tracks`, `favorite_playlists`

3. **Authentication**: If `ADMIN_PASSWORD` is not set in your Docker configuration, authentication is not required.

4. **Status**: When adding an item, always use `"status": "queue"`.

5. **SSE Endpoints**: The `/api/stream_processing` and `/api/stream_item_output/:id` endpoints use Server-Sent Events (SSE) for real-time updates. They are not intended to be used with curl, but rather with EventSource JavaScript clients or SSE libraries.

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
