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
echo " PRODUCTION MODE - VERSION: ${VERSION:-unknown}"
echo "----------------------------------------"

# Set custom umask (default: 0022 for 755 permissions)
# When PUID/PGID are set, default to 0002 for 775 permissions (group writable)
if [ -n "$UMASK" ]; then
  umask $UMASK
elif [ -n "$PUID" ] && [ -n "$PGID" ]; then
  umask 0002
else
  umask 0022
fi

# Set ownership of shared directories if PUID/PGID are set
if [ -n "$PUID" ] && [ -n "$PGID" ]; then
  echo "🔑 [TIDARR] Setting ownership to PUID=$PUID PGID=$PGID"
  chown -R $PUID:$PGID /home/app/standalone/shared 2>/dev/null || true

  # Run Node.js as specified UID/GID using su-exec
  # Set HOME to /home/app/standalone/shared for tiddl config access
  exec su-exec $PUID:$PGID env HOME=/home/app/standalone/shared yarn --cwd ./api prod
else
  # Run as root (default)
  yarn --cwd ./api prod
fi