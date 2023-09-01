FROM node:20-alpine

# update and install dependency
RUN apk update && apk upgrade

RUN apk add git
RUN apk add build-base

# BUILDER
WORKDIR /home/app/standalone
ENV NEXT_TELEMETRY_DISABLED 1

ARG NODE_ENV
ENV NODE_ENV="${NODE_ENV}"

ENV NEXT_TELEMETRY_DISABLED 1

FROM node:20-alpine AS runner
WORKDIR /home/app/standalone

RUN echo "*** install tidal-dl ***"
ENV PYTHONUNBUFFERED=1
RUN apk add curl
RUN apk add --update --no-cache python3 py3-pip && ln -sf python3 /usr/bin/python
RUN python3 -m pip install --no-cache --upgrade pip wheel setuptools 
RUN python3 -m pip install --no-cache --upgrade tidal-dl

RUN echo "*** install beets ***"
RUN apk add --no-cache -X http://dl-cdn.alpinelinux.org/alpine/edge/community beets

RUN mkdir /home/app/standalone/shared
RUN mkdir /home/app/standalone/shared/beets

RUN mkdir -p /home/app/standalone/shared/beets
RUN touch /home/app/standalone/shared/beets/beets-library.blb

RUN yarn install
EXPOSE 8484
ENV PORT 8484

CMD ["yarn", "dev"]
