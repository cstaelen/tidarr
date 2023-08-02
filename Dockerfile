FROM node:20-alpine AS dependencies

# update and install dependency
RUN apk update && apk upgrade

RUN apk add git
RUN apk add build-base

# DEPENDENCIES
WORKDIR /home/app
COPY package.json ./
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

ENV PYTHONUNBUFFERED=1
RUN apk add --update --no-cache python3 py3-pip && ln -sf python3 /usr/bin/python
RUN python3 -m pip install --no-cache --upgrade pip setuptools wheel
RUN python3 -m pip install --no-cache --upgrade tidal-dl

COPY --from=builder /home/app/.next/standalone ./standalone
COPY --from=builder /home/app/.next/standalone ./standalone
COPY --from=builder /home/app/public /home/app/standalone/public
COPY --from=builder /home/app/.next/static /home/app/standalone/.next/static

EXPOSE 3000
ENV PORT 3000
CMD ["node", "./standalone/server.js"]
