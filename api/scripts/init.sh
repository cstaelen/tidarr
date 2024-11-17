#!/bin/sh
echo "Check config running ... "

BASE_URL="/home/app/standalone"
SETTINGS_URL="$BASE_URL/settings"
SHARED_URL="$BASE_URL/shared"

if [ -f "/root/.tidal-dl.token.json" ]; then
    echo "Load .tidal-dl.token.json from /root"
    cp /root/.tidal-dl.token.json $SHARED_URL/.tidal-dl.token.json
    cp /root/.tidal-dl.token.json /home/app/standalone/
    echo "[TidalDL] Token OK"
else
    if [ -f "$SHARED_URL/.tidal-dl.token.json" ]; then
        echo "Load $SHARED_URL.tidal-dl.token.json from $SHARED_URL"
        cp $SHARED_URL/.tidal-dl.token.json /home/app/standalone/
        cp $SHARED_URL/.tidal-dl.token.json /root/
        echo "[TidalDL] Token OK"
    else
        echo "[TidalDL] No token found. Please authenticate."
    fi
fi

if [ -f "$SHARED_URL/.tiddl_config.json" ]; then
    echo "Load .tiddl_config.json to app"
    cp $SHARED_URL/.tiddl_config.json /home/app/standalone/.tiddl_config.json
    cp $SHARED_URL/.tiddl_config.json /root/.tiddl_config.json
    echo "[TidalDL] Config OK"
else
    if [ -f "$SETTINGS_URL/.tiddl_config.json" ]; then
        cp $SETTINGS_URL/.tiddl_config.json /home/app/standalone/.tiddl_config.json
        cp $SETTINGS_URL/.tiddl_config.json /root/.tiddl_config.json
        cp $SETTINGS_URL/.tiddl_config.json $SHARED_URL/.tiddl_config.json
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