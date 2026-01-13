
**How it works:**

1. Create a shell script named `custom-script.sh` in your config folder (the mounted `shared/` volume)
2. The script will be automatically detected and executed during post-processing
3. The script runs **after** permissions are set but **before** files are moved to the library

**Execution context:**

- **OS Environment**: Alpine Linux 3.21
- **Shell**: `/bin/sh` (Alpine's default shell - BusyBox ash)
- **Available tools**: bash, ffmpeg, curl, wget, python3, beets, and standard Alpine utilities
- **Working directory**: The script runs in the `/shared/.processing` directory where files are temporarily stored
- **Timing**: Executed after Beets tagging (if enabled) and permissions setup, but before moving to library
- **Pipeline order**: `Download → Beets → Set Permissions → **Custom Script** → Move to Library → Plex Scan → Notifications`

**Available environment variables:**

Your script has access to these environment variables:

```bash
PROCESSING_PATH  # Path to the .processing directory where files are located
ITEM_TYPE        # Type of content: album, track, video, playlist, mix, artist, etc.
ITEM_URL         # Tidal URL of the item being processed
```

**Example script:**

```bash
#!/bin/sh
# custom-script.sh - Example custom processing script

echo "Processing ${ITEM_TYPE} from ${ITEM_URL}"
echo "Files located in: ${PROCESSING_PATH}"

# Example 1: Convert FLAC to MP3 for mobile sync
find . -name "*.flac" -type f | while read file; do
  echo "Converting: $file"
  ffmpeg -i "$file" -codec:a libmp3lame -qscale:a 2 "${file%.flac}.mp3"
done

# Example 2: Send custom notification
curl -X POST "https://your-webhook.com/notify" \
  -H "Content-Type: application/json" \
  -d "{\"type\": \"$ITEM_TYPE\", \"url\": \"$ITEM_URL\"}"

# Example 3: Custom tagging or metadata modifications
# Your custom processing logic here...

echo "Custom processing complete!"
```

**Use cases:**

- Convert FLAC to additional formats (MP3, AAC, etc.)
- Apply custom tagging or metadata modifications
- Send custom notifications to external services
- Integrate with other automation systems
- Organize or rename files with custom logic
- Generate thumbnails or additional artwork

**Important notes:**

- The script is **optional** - Tidarr works normally without it
- The script must be executable (chmod +x is applied automatically)
- Script errors won't stop the download pipeline - processing continues regardless
- All stdout/stderr output is logged and visible in the download terminal dialog
- Files are moved to `/library` after the script completes successfully

**File location**: `/your/docker/path/to/tidarr/config/custom-script.sh`

