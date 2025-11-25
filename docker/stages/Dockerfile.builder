WORKDIR /home/app/standalone

ENV SHELL=bash
ARG NODE_ENV
ENV NODE_ENV="${NODE_ENV}"

# Install build dependencies
RUN apk add --no-cache git npm nodejs && \
    npm install -g pnpm && \
    rm -rf /var/cache/apk/*

COPY . .

# Install all workspace dependencies at once
RUN \
      --mount=type=cache,target=/root/.local/share/pnpm/store,sharing=locked \
      pnpm install --frozen-lockfile

# Build app
RUN pnpm --filter tidarr-react run build

# Build api
RUN pnpm --filter tidarr-api run build 