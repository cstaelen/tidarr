#!/bin/sh
echo "Check config running ... "

BASE_URL="/home/app/standalone"
SETTINGS_URL="$BASE_URL/settings"
SHARED_URL="$BASE_URL/shared"

if [ -f "/root/.tiddl_config.json" ]; then
    echo "[Tiddl] Save .tiddl_config.json to shared volume"
    cp /root/.tiddl_config.json $SHARED_URL/.tiddl_config.json
    echo "[Tiddl] Config OK"
else
    if [ -f "$SHARED_URL/.tiddl_config.json" ]; then
        echo "[Tiddl] Load .tiddl_config.json from shared volume"
        cp $SHARED_URL/.tiddl_config.json /root/.tiddl_config.json
        echo "[Tiddl] Config OK"
    else
        echo "[Tiddl] No token set"
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