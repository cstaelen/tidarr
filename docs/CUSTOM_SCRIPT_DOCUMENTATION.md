# Custom Script Documentation

Tidarr supports two custom shell scripts that allow you to perform custom operations during the post-processing pipeline:

1. **`custom-script.sh`** - Runs **before** files are moved to the library
2. **`custom-post-script.sh`** - Runs **after** files are moved to the library

---

## Pipeline Order

```
Download → Beets → ReplayGain → Permissions → custom-script.sh → Move to Library → custom-post-script.sh → Plex/Jellyfin/Navidrome Scan → Notifications
```

---

## Pre-Move Script: `custom-script.sh`

**How it works:**

1. Create a shell script named `custom-script.sh` in your config folder (the mounted `shared/` volume)
2. The script will be automatically detected and executed during post-processing
3. The script runs **before** files are moved to the library

**Execution context:**

- **OS Environment**: Alpine Linux 3.21
- **Shell**: `/bin/sh` (Alpine's default shell - BusyBox ash)
- **Available tools**: bash, ffmpeg, curl, wget, python3, beets, and standard Alpine utilities
- **Working directory**: The script runs in the `/shared/.processing/{item_id}` directory where files are temporarily stored

**Available environment variables:**

```bash
PROCESSING_PATH  # Path to the .processing directory where files are located
ITEM_TYPE        # Type of content: album, track, video, playlist, mix, artist, etc.
ITEM_URL         # Tidal URL of the item being processed
```

**Example script:**

```bash
#!/bin/sh
# custom-script.sh - Example pre-move processing script

echo "Processing ${ITEM_TYPE} from ${ITEM_URL}"
echo "Files located in: ${PROCESSING_PATH}"

# Example 1: Convert FLAC to MP3 for mobile sync
find . -name "*.flac" -type f | while read file; do
  echo "Converting: $file"
  ffmpeg -i "$file" -codec:a libmp3lame -qscale:a 2 "${file%.flac}.mp3"
done

# Example 2: Custom tagging or metadata modifications
# Your custom processing logic here...

echo "Custom processing complete!"
```

**Use cases:**

- Convert FLAC to additional formats (MP3, AAC, etc.)
- Apply custom tagging or metadata modifications
- Generate thumbnails or additional artwork
- Modify files before they reach the library

**File location**: `/your/docker/path/to/tidarr/config/custom-script.sh`

---

## Post-Move Script: `custom-post-script.sh`

**How it works:**

1. Create a shell script named `custom-post-script.sh` in your config folder (the mounted `shared/` volume)
2. The script will be automatically detected and executed after files are moved to the library
3. The script runs **before** library scans (Plex/Jellyfin/Navidrome) and notifications

**Execution context:**

- **OS Environment**: Alpine Linux 3.21
- **Shell**: `/bin/sh` (Alpine's default shell - BusyBox ash)
- **Available tools**: bash, ffmpeg, curl, wget, python3, beets, and standard Alpine utilities
- **Working directory**: The script runs in the library directory (e.g., `/music`)

**Available environment variables:**

```bash
DESTINATION_PATH  # The library path where files were moved (e.g., /music)
FOLDERS_MOVED     # Comma-separated list of folders that were moved (relative to DESTINATION_PATH)
ITEM_TYPE         # Type of content: album, track, video, playlist, mix, artist, etc.
ITEM_URL          # Tidal URL of the item being processed
```

**Example script:**

```bash
#!/bin/sh
# custom-post-script.sh - Example post-move processing script

echo "Item moved to: ${DESTINATION_PATH}"
echo "Folders: ${FOLDERS_MOVED}"
echo "Type: ${ITEM_TYPE}"

# Example 1: Move playlists to a separate directory
if [ "$ITEM_TYPE" = "playlist" ] || [ "$ITEM_TYPE" = "mix" ]; then
  echo "Moving playlist files to /playlists..."
  mv "${DESTINATION_PATH}/playlists/"* /playlists/ 2>/dev/null || true
fi

# Example 2: Send custom notification with final path
curl -X POST "https://your-webhook.com/notify" \
  -H "Content-Type: application/json" \
  -d "{\"type\": \"$ITEM_TYPE\", \"path\": \"$DESTINATION_PATH\", \"folders\": \"$FOLDERS_MOVED\"}"

# Example 3: Sync to external storage
# rsync -av "${DESTINATION_PATH}/" /mnt/backup/music/

echo "Post-processing complete!"
```

**Use cases:**

- Move specific content types to different directories (playlists, mixes, etc.)
- Sync files to external storage or backup locations
- Send notifications with final file paths
- Trigger external automation systems
- Update external databases or catalogs

**File location**: `/your/docker/path/to/tidarr/config/custom-post-script.sh`

---

## Important Notes

- Both scripts are **optional** - Tidarr works normally without them
- Scripts are made executable automatically (chmod +x is applied)
- Script errors won't stop the download pipeline - processing continues regardless
- All stdout/stderr output is logged and visible in the download terminal dialog
- Scripts run sequentially, not in parallel

---

## Docker Volume Example

To use the playlist separation feature mentioned above, you need to mount an additional volume:

```yaml
services:
  tidarr:
    volumes:
      - /path/to/config:/shared
      - /path/to/music:/music
      - /path/to/playlists:/playlists  # Additional volume for playlists
```

Then in your `custom-post-script.sh`:

```bash
#!/bin/sh
if [ "$ITEM_TYPE" = "playlist" ] || [ "$ITEM_TYPE" = "mix" ]; then
  mv "${DESTINATION_PATH}/playlists/"* /playlists/ 2>/dev/null || true
fi
```
