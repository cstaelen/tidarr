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

sleep 2
yarn --cwd ./api prod