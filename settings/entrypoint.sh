#!/bin/sh
echo "Entrypoint running ... "

BASE_URL="/home/app/standalone"
SETTINGS_URL="$BASE_URL/settings"
SHARED_URL="$BASE_URL/shared"

if [ -f "/root/.tidal-dl.token.json" ]; then
    echo "Moving .tidal-dl.token.json to $SHARED_URL"
    cp /root/.tidal-dl.token.json $SHARED_URL/.tidal-dl.token.json
    echo "Tidal token OK"
else
    if [ -f "$SHARED_URL/.tidal-dl.token.json" ]; then
        cp $SHARED_URL/.tidal-dl.token.json /root
        echo "Tidal token OK"
    else
        echo -n "No token found. Please authenticate."
    fi
fi

if [ -f "$SHARED_URL/.tidal-dl.json" ]; then
    echo "Moving .tidal-dl.json to /root"
    cp $SHARED_URL/.tidal-dl.json /root/.tidal-dl.json
    echo "Tidal config OK"
else
    if [ -f "$SETTINGS_URL/.tidal-dl.json" ]; then
        cp $SETTINGS_URL/.tidal-dl.json /root/.tidal-dl.json
        cp $SETTINGS_URL/.tidal-dl.json $SHARED_URL/.tidal-dl.json
        echo "Tidal config OK"
    fi
fi

if [ ! -f "$SHARED_URL/beets-config.yml" ]; then    
    cp $SETTINGS_URL/beets-config.yml $SHARED_URL/beets-config.yml
    echo "Beets config OK"
fi

if [ ! -f "$SHARED_URL/beets/beets-library.blb" ]; then    
    mkdir -p $SHARED_URL/beets
    touch $SHARED_URL/beets/beets-library.blb
    echo "Beets db OK"
fi

if [ ! -f "$SHARED_URL/beets/beet.log" ]; then    
    touch $SHARED_URL/beets/beet.log
    echo "Beets log OK"
fi

