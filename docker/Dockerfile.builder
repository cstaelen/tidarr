FROM ghcr.io/linuxserver/baseimage-alpine:3.18 AS dependencies

# update and install dependency
RUN apk update && apk upgrade
RUN apk add git build-base npm nodejs

# DEPENDENCIES
WORKDIR /home/app
ENV SHELL bash

COPY package.json ./
COPY .env ./
COPY docker/ ./docker
COPY next.config.js ./

RUN npm add -g npx
RUN npm install

# BUILDER

FROM ghcr.io/linuxserver/baseimage-alpine:3.18 AS builder
WORKDIR /home/app

ARG NODE_ENV
ENV NODE_ENV="${NODE_ENV}"
ENV SHELL bash
ENV NEXT_TELEMETRY_DISABLED 1

COPY ./app /home/app/app
COPY ./api /home/app/api

COPY . .
COPY --from=dependencies /home/app/node_modules ./node_modules
COPY --from=dependencies /home/app/package-lock.json ./package-lock.json

RUN apk add npm nodejs
RUN npm add -g npx

RUN npm run front-build
RUN npm run api-build

# RUNNER

FROM ghcr.io/linuxserver/baseimage-alpine:3.18 AS runner
WORKDIR /home/app

ENV NEXT_TELEMETRY_DISABLED 1
ENV SHELL bash
ENV PYTHONUNBUFFERED=1

RUN apk add --update --no-cache curl nodejs npm

RUN echo "*** install tidal-dl ***"

RUN apk add --update --no-cache python3 py3-pip && ln -sf python3 /usr/bin/python
RUN python3 -m pip install --no-cache --upgrade pip wheel setuptools chardet tidal-dl

RUN echo "*** install beets ***"
RUN apk add --no-cache -X http://dl-cdn.alpinelinux.org/alpine/edge/community/x86_64/ beets

COPY --from=builder /home/app/.env /home/app/standalone/.env
COPY --from=builder /home/app/package.json /home/app/standalone/package.json
COPY --from=builder /home/app/package-lock.json /home/app/standalone/package-lock.json

COPY --from=builder /home/app/docker /home/app/standalone/docker
COPY --from=builder /home/app/settings /home/app/standalone/settings

COPY --from=builder /home/app/.next/standalone /home/app/standalone
COPY --from=builder /home/app/.next/static /home/app/standalone/.next/static
COPY --from=builder /home/app/public /home/app/standalone/public

COPY --from=builder /home/app/api/dist /home/app/standalone/api/dist
COPY --from=builder /home/app/api/scripts /home/app/standalone/api/scripts

WORKDIR /home/app/standalone

EXPOSE 8484
EXPOSE 8585

ENTRYPOINT ["npm", "run", "prod"]
