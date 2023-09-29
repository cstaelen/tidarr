#!/bin/sh
echo "Check config running ... "

BASE_URL="/home/app/standalone"
SETTINGS_URL="$BASE_URL/settings"
SHARED_URL="$BASE_URL/shared"

if [ -f "$SHARED_URL/.tidal-dl.token.json" ]; then
    echo "Moving $SHARED_URL.tidal-dl.token.json to /root"
    # cp $SHARED_URL/.tidal-dl.token.json /root
    cp $SHARED_URL/.tidal-dl.token.json /home/app/
    echo "[TidalDL] Token OK"
else
    if [ -f "/root/.tidal-dl.token.json" ]; then
        echo "Moving .tidal-dl.token.json to $SHARED_URL"
        cp /root/.tidal-dl.token.json $SHARED_URL/.tidal-dl.token.json
        cp /root/.tidal-dl.token.json /home/app/
        echo "[TidalDL] Token OK"
    else
        echo "[TidalDL] No token found. Please authenticate."
    fi
fi

if [ -f "$SHARED_URL/.tidal-dl.json" ]; then
    echo "Moving .tidal-dl.json to /root"
    # cp $SHARED_URL/.tidal-dl.json /root/.tidal-dl.json
    cp $SHARED_URL/.tidal-dl.json /home/app/.tidal-dl.json
    echo "[TidalDL] Config OK"
else
    if [ -f "$SETTINGS_URL/.tidal-dl.json" ]; then
        cp $SETTINGS_URL/.tidal-dl.json /home/app/.tidal-dl.json
        cp $SETTINGS_URL/.tidal-dl.json $SHARED_URL/.tidal-dl.json
        echo "[TidalDL] Config OK"
    fi
fi

if [ ! -f "$SHARED_URL/beets-config.yml" ]; then    
    cp $SETTINGS_URL/beets-config.yml $SHARED_URL/beets-config.yml
    echo "[Beets] Config OK"
fi

if [ ! -f "$SHARED_URL/beets/beets-library.blb" ]; then    
    mkdir -p $SHARED_URL/beets
    touch $SHARED_URL/beets/beets-library.blb
    echo "[Beets] DB OK"
fi

if [ ! -f "$SHARED_URL/beets/beet.log" ]; then    
    touch $SHARED_URL/beets/beet.log
    echo "[Beets] Log OK"
fi