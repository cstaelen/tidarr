FROM ghcr.io/linuxserver/baseimage-alpine:3.18 AS dependancies

# update and install dependency
RUN apk update && apk upgrade

RUN apk add git
RUN apk add build-base

# BUILDER
WORKDIR /home/app

ARG NODE_ENV
ENV NODE_ENV="${NODE_ENV}"

FROM ghcr.io/linuxserver/baseimage-alpine:3.18 AS runner
WORKDIR /home/app/standalone

ENV PYTHONUNBUFFERED=1
RUN apk add curl yarn nodejs
RUN yarn global add npx 

RUN echo "*** install tidal-dl ***"
RUN apk add --update --no-cache python3 py3-pip && ln -sf python3 /usr/bin/python
RUN python3 -m pip install --no-cache --upgrade pip wheel setuptools chardet
RUN python3 -m pip install --no-cache --upgrade tidal-dl

RUN echo "*** install beets ***"
RUN apk add --no-cache -X http://dl-cdn.alpinelinux.org/alpine/edge/community beets

RUN mkdir /home/app/standalone/shared
RUN mkdir /home/app/standalone/shared/beets

RUN mkdir -p /home/app/standalone/shared/beets
RUN touch /home/app/standalone/shared/beets/beets-library.blb

COPY . ./standalone

RUN yarn install

EXPOSE 8484
EXPOSE 8585

ENTRYPOINT ["sh", "/home/app/standalone/docker/run-dev.sh"]
