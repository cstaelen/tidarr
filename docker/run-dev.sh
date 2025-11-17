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
echo " DEVELOPMENT MODE - VERSION: ${VERSION:-unknown}"
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
  chown -R $PUID:$PGID /home/app/standalone/shared 2>/dev/null || true

  # Run yarn as specified UID/GID using su-exec
  # Set HOME to /home/app/standalone/shared for tiddl config access
  # IMPORTANT: Set umask AFTER su-exec switch to ensure it's inherited by the user process
  exec su-exec $PUID:$PGID sh -c "umask $EFFECTIVE_UMASK && exec env HOME=/home/app/standalone/shared sh -c 'yarn install && yarn --cwd ./app install && yarn --cwd ./api install && yarn --cwd ./e2e install && yarn dev'"
else
  # Run as root (default)
  yarn install
  yarn --cwd ./app install
  yarn --cwd ./api install
  yarn --cwd ./e2e install
  yarn dev
fi