FROM ghcr.io/linuxserver/baseimage-alpine:3.18 AS dependencies

# update and install dependency
RUN apk update && apk upgrade

RUN apk add git
RUN apk add build-base

RUN apk add yarn nodejs
RUN yarn global add npx 
RUN yarn global add dotenv

# DEPENDENCIES
WORKDIR /home/app
COPY package.json ./
COPY .env ./
COPY docker/ ./docker
COPY yarn.lock ./
COPY next.config.js ./
RUN yarn install

# BUILDER
FROM ghcr.io/linuxserver/baseimage-alpine:3.18 AS builder
WORKDIR /home/app

RUN apk add yarn nodejs
RUN yarn global add npx
RUN yarn add dotenv

COPY --from=dependencies /home/app/node_modules ./node_modules
COPY --from=dependencies /home/app/.env ./.env
COPY --from=dependencies /home/app/docker ./docker
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

ARG NODE_ENV
ENV NODE_ENV="${NODE_ENV}"

RUN yarn front-build
RUN yarn api-build

# RUNNER
FROM ghcr.io/linuxserver/baseimage-alpine:3.18 AS runner
WORKDIR /home/app

ENV NEXT_TELEMETRY_DISABLED 1

RUN apk add --update --no-cache curl nodejs yarn
RUN yarn global add concurrently 
RUN yarn add express dotenv

RUN echo "*** install tidal-dl ***"
ENV PYTHONUNBUFFERED=1

RUN apk add --update --no-cache python3 py3-pip && ln -sf python3 /usr/bin/python
RUN python3 -m pip install --no-cache --upgrade pip wheel setuptools 
RUN python3 -m pip install --no-cache --upgrade tidal-dl

RUN echo "*** install beets ***"
RUN apk add --no-cache -X http://dl-cdn.alpinelinux.org/alpine/edge/community beets

COPY --from=builder /home/app/.next/standalone /home/app/standalone
COPY --from=builder /home/app/public /home/app/standalone/public
COPY --from=builder /home/app/.next/static /home/app/standalone/.next/static
COPY --from=builder /home/app/settings /home/app/standalone/settings

COPY --from=builder /home/app/.env /home/app/standalone/.env
COPY --from=builder /home/app/docker /home/app/standalone/docker
COPY --from=builder /home/app/api/dist /home/app/standalone/api/dist
COPY --from=builder /home/app/api/scripts /home/app/standalone/api/scripts

WORKDIR /home/app/standalone

EXPOSE 8484
EXPOSE 8585

ENTRYPOINT ["sh", "/home/app/standalone/docker/run-prod.sh"]
