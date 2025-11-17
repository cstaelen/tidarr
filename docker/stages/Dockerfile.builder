WORKDIR /home/app/standalone

ENV SHELL=bash
ARG NODE_ENV
ENV NODE_ENV="${NODE_ENV}"

# Install build dependencies
RUN apk add --no-cache git npm nodejs && \
    npm install -g yarn && \
    rm -rf /var/cache/apk/*

COPY . .

# Common app

RUN \
      --mount=type=cache,target=/usr/local/share/.cache/yarn/v6,sharing=locked \
      yarn --prefer-offline --frozen-lockfile

# Build app

RUN \
      --mount=type=cache,target=/usr/local/share/.cache/yarn/v6,sharing=locked \
      yarn --cwd ./app --prefer-offline --frozen-lockfile

RUN yarn --cwd ./app build 

# Build api

RUN \
      --mount=type=cache,target=/usr/local/share/.cache/yarn/v6,sharing=locked \
      yarn --cwd ./api --prefer-offline --frozen-lockfile

RUN yarn --cwd ./api build 