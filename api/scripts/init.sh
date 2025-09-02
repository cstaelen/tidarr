#!/bin/sh
echo "Check config running ... "

if [ "$1" == "development" ]; then
    SETTINGS_URL="/home/app/build/settings"
else
    SETTINGS_URL="/home/app/standalone/settings"
fi
SHARED_URL="/home/app/standalone/shared"

if [ -f "$SHARED_URL/tiddl.json" ]; then
    echo "[Tiddl] Load tiddl.json from shared volume"
    cp $SHARED_URL/tiddl.json /root/tiddl.json
    tiddl auth refresh
    echo "[Tiddl] Load shared config OK "
else
    echo "[Tiddl] Load tiddl.json default template"
    cp $SETTINGS_URL/tiddl.json $SHARED_URL/tiddl.json
    cp $SETTINGS_URL/tiddl.json /root/tiddl.json
    tiddl auth refresh
    echo "[Tiddl] Init config OK"
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