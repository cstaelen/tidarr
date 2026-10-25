# Tidarr for Windows

A Windows-native fork of [tidarr](https://github.com/cstaelen/tidarr) — a web interface for downloading media from Tidal using [tiddl](https://github.com/oskvr37/tiddl).

## Requirements

The launcher installs these automatically if missing:

- [Node.js](https://nodejs.org) (LTS)
- [Python 3.13](https://python.org) + tiddl 3.4.4
- [ffmpeg](https://ffmpeg.org)

## Quick Start

```
start.cmd
```

Then open http://localhost:3000 in your browser.

On first run, you'll be prompted to authorize your Tidal account.

## Folder Structure

```
tidarr-win\
  userfiles\
    shared\    ← config, auth tokens, queue
    music\     ← downloaded music (set in Settings)
```

## Cleanup

```
cleanup.cmd
```

Removes all generated files and resets to a clean state. Run `start.cmd` afterwards to reinstall.

## Notes

- **Extract to `C:\tidarr` for best results** — running from Desktop or user folders can cause permission issues with npm
- Requires running from a folder where your user has write permissions (e.g. `C:\tidarr`, not Desktop)
- tiddl stores auth tokens in `userfiles\shared\.tiddl\`
- Download path can be changed in Settings → Config

## Troubleshooting

**`ERROR: No matching distribution found for tiddl==3.4.4`**

tiddl 3.4.4 requires Python 3.13 or newer. If Python 3.12 or older is already
installed, `python` on your PATH cannot install it. The launcher detects this by
version, installs Python 3.13 alongside whatever you already have, and runs the
tiddl install with that interpreter — no uninstall required.

## Original Project

https://github.com/cstaelen/tidarr
