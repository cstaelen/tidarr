#!/bin/sh

# AUTH JWT RANDOM SECRET
export JWT_SECRET=`tr -dc A-Za-z0-9 </dev/urandom | head -c 15; echo`

echo "----------------------------------------"
cat << "EOF"
 _____ ___ ____    _    ____  ____
|_   _|_ _|  _ \  / \  |  _ \|  _ \
  | |  | || | | |/ _ \ | |_) | |_) |
  | |  | || |_| / ___ \|  _ <|  _ <
  |_| |___|____/_/   \_\_| \_\_| \_\
EOF
echo "----------------------------------------"

# Detect environment mode (default: production)
MODE=${NODE_ENV:-production}

if [ "$MODE" = "development" ]; then
  echo " DEVELOPMENT MODE - VERSION: ${VERSION:-unknown}"
else
  echo " PRODUCTION MODE - VERSION: ${VERSION:-unknown}"
fi
echo "----------------------------------------"

# Set custom umask (default: 0022 for 755 permissions)
# When PUID/PGID are set, default to 0002 for 775 permissions (group writable)
if [ -n "$UMASK" ]; then
  EFFECTIVE_UMASK=$UMASK
elif [ -n "$PUID" ] && [ -n "$PGID" ]; then
  EFFECTIVE_UMASK=0002
else
  EFFECTIVE_UMASK=0022
fi

# Set umask for root shell
umask $EFFECTIVE_UMASK

# Set ownership of shared directories if PUID/PGID are set
if [ -n "$PUID" ] && [ -n "$PGID" ]; then
  echo "🔑 [TIDARR] Setting ownership to PUID=$PUID PGID=$PGID"
  echo "🔑 [TIDARR] Using UMASK=$EFFECTIVE_UMASK"

  # Create required directories if they don't exist
  mkdir -p /shared/.tiddl 2>/dev/null || true
  mkdir -p /shared/beets 2>/dev/null || true

  # Change ownership only of specific Tidarr-related files/directories
  # Avoid traversing cache directories (.cache, .yarn, .pki, node_modules)
  chown $PUID:$PGID /shared 2>/dev/null || true
  chown -R $PUID:$PGID /shared/.tiddl 2>/dev/null || true
  chown -R $PUID:$PGID /shared/beets 2>/dev/null || true
  chown $PUID:$PGID /shared/*.json 2>/dev/null || true
  chown $PUID:$PGID /shared/*.css 2>/dev/null || true
  chown $PUID:$PGID /shared/*.yml 2>/dev/null || true

  # In production, allow the user to write custom.css in the app/build directory
  if [ "$ENVIRONMENT" != "development" ]; then
    chown -R $PUID:$PGID /tidarr/app/build 2>/dev/null || true
  fi

  # Run as specified UID/GID using su-exec
  # Set HOME to /shared for tiddl config access
  # Export UMASK as environment variable so Node.js can access it for setPermissions()
  # Set umask for any processes that respect it (tiddl/Python ignores shell umask)
  if [ "$ENVIRONMENT" = "development" ]; then
    exec su-exec $PUID:$PGID sh -c "export HOME=/shared && export UMASK=$EFFECTIVE_UMASK && umask $EFFECTIVE_UMASK && exec sh -c 'yarn install && yarn dev'"
  else
    exec su-exec $PUID:$PGID sh -c "export HOME=/shared && export UMASK=$EFFECTIVE_UMASK && umask $EFFECTIVE_UMASK && exec yarn --cwd ./api prod"
  fi
else
  # Run as root (default)
  if [ "$ENVIRONMENT" = "development" ]; then
    yarn install
    yarn dev
  else
    yarn --cwd ./api prod
  fi
fi
