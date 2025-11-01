#!/bin/sh

echo "🕖 [TIDARR] Application loading ... "

SETTINGS_URL="/home/app/standalone/settings"
PUBLIC_URL="/home/app/standalone/app/build"
DEV_PUBLIC_URL="/home/app/standalone/app/public"
SHARED_URL="/home/app/standalone/shared"

if [ -f "$SHARED_URL/tiddl.json" ]; then
    echo "✅ [TIDDL] Load tiddl config"
else
    cp $SETTINGS_URL/tiddl.json $SHARED_URL/tiddl.json
    echo "✅ [TIDDL] Create tiddl config from template"
fi

if [ ! -f "$SHARED_URL/beets-config.yml" ]; then    
    cp $SETTINGS_URL/beets-config.yml $SHARED_URL/beets-config.yml
    echo "✅ [BEETS] Load config from template"
fi

if [ ! -f "$SHARED_URL/beets/beets-library.blb" ]; then    
    mkdir -p $SHARED_URL/beets
    touch $SHARED_URL/beets/beets-library.blb
    echo "✅ [BEETS] DB file created"
fi

if [ ! -f "$SHARED_URL/beets/beet.log" ]; then
    touch $SHARED_URL/beets/beet.log
    echo "✅ [BEETS] Log file created"
fi

if [ ! -f "$SHARED_URL/custom.css" ]; then
    cp $PUBLIC_URL/custom.css $SHARED_URL/custom.css
    echo "✅ [CSS] Custom style file created"
fi

if [ "$1" == "development" ]; then
    cp $SHARED_URL/custom.css $DEV_PUBLIC_URL/custom.css
else
    cp $SHARED_URL/custom.css $PUBLIC_URL/custom.css
fi
echo "✅ [CSS] Load custom styles"