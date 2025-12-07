#!/bin/sh

echo "🕖 [TIDARR] Application loading ... "

SETTINGS_URL="/tidarr/settings"
PUBLIC_URL="/tidarr/app/build"
DEV_PUBLIC_URL="/tidarr/app/public"
SHARED_URL="/shared"

mkdir -p $SHARED_URL/.tiddl/ 2>&1 || {
    echo "❌ [TIDDL] Failed to create .tiddl directory"
    exit 1
}

if [ ! -f "$SHARED_URL/.tiddl/config.toml" ]; then
    if cp $SETTINGS_URL/config.toml $SHARED_URL/.tiddl/config.toml 2>&1; then
        echo "✅ [TIDDL] Created config.toml from template"
    else
        echo "❌ [TIDDL] Failed to copy config.toml - check volume permissions"
        ls -la $SHARED_URL/.tiddl/ 2>&1 || echo "Cannot list directory"
        exit 1
    fi
else
    echo "✅ [TIDDL] Config.toml already exists"
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