#!/usr/bin/env sh

sh /home/app/standalone/docker/env.sh
sleep 2
pnpm install
pnpm run dev