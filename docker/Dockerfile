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

# RUNNER
FROM node:20-alpine AS runner
WORKDIR /home/app/standalone

ENV NEXT_TELEMETRY_DISABLED 1

RUN echo "*** install tidal-dl ***"
ENV PYTHONUNBUFFERED=1
RUN apk add --update --no-cache python3 py3-pip && ln -sf python3 /usr/bin/python
RUN python3 -m pip install --no-cache --upgrade pip wheel setuptools 
RUN python3 -m pip install --no-cache --upgrade tidal-dl

RUN echo "*** install beets ***"
RUN apk add --no-cache -X http://dl-cdn.alpinelinux.org/alpine/edge/community beets

RUN yarn install
EXPOSE 3000
ENV PORT 3000

CMD ["yarn", "dev"]
