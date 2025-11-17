WORKDIR /home/app/standalone

ENV SHELL=bash
ARG NODE_ENV
ENV NODE_ENV="${NODE_ENV}"

# Install build dependencies
RUN apk add --no-cache git npm nodejs && \
    npm install -g yarn && \
    rm -rf /var/cache/apk/*

COPY . .

# Install all workspace dependencies at once
RUN \
      --mount=type=cache,target=/usr/local/share/.cache/yarn/v6,sharing=locked \
      yarn install --prefer-offline --frozen-lockfile

# Build app
RUN yarn workspace tidarr-react run build

# Build api
RUN yarn workspace tidarr-api run build 