FROM node:20-alpine AS dependencies

# update and install dependency
RUN apk update && apk upgrade

RUN apk add git
RUN apk add build-base

# DEPENDENCIES
WORKDIR /home/app
COPY package.json ./
COPY yarn.lock ./
COPY next.config.js ./
RUN yarn install

# BUILDER
FROM node:20-alpine AS builder
WORKDIR /home/app

COPY --from=dependencies /home/app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

ARG NODE_ENV
ENV NODE_ENV="${NODE_ENV}"

RUN yarn build

# RUNNER
FROM node:20-alpine AS runner
WORKDIR /home/app

ENV NEXT_TELEMETRY_DISABLED 1

RUN echo "*** install tidal-dl ***"
ENV PYTHONUNBUFFERED=1
RUN apk add --update --no-cache python3 py3-pip && ln -sf python3 /usr/bin/python
RUN python3 -m pip install --no-cache --upgrade pip wheel setuptools 
RUN python3 -m pip install --no-cache --upgrade tidal-dl

RUN echo "*** install beets ***"
RUN apk add --no-cache -X http://dl-cdn.alpinelinux.org/alpine/edge/community beets

COPY --from=builder /home/app/.next/standalone ./standalone
COPY --from=builder /home/app/public /home/app/standalone/public
COPY --from=builder /home/app/.next/static /home/app/standalone/.next/static
COPY --from=builder /home/app/settings /home/app/standalone/settings

WORKDIR /home/app/standalone

EXPOSE 8484
ENV PORT 8484

CMD ["node", "./server.js"]
