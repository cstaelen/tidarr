ARG BUILDPLATFORM
ARG TARGETPLATFORM

###############################################################
## BASE IMAGE - Shared setup for dev and prod                #
###############################################################

FROM python:3.13-alpine3.21 AS base

WORKDIR /tidarr

ENV SHELL=bash \
    PYTHONUNBUFFERED=1 \
    HOME=/shared

# Install system dependencies (shared by dev and prod)
RUN apk update && apk upgrade && \
    apk add --no-cache \
        npm nodejs \
        ffmpeg \
        beets \
        bash \
        su-exec \
        curl \
        wget && \
    rm -rf /var/cache/apk/*

# Install Python and Node dependencies
# Add build tools temporarily for native modules, then remove them
COPY docker/requirements.txt docker/requirements.txt
RUN apk add --no-cache --virtual .build-deps \
        python3-dev \
        build-base && \
    npm install -g yarn && \
    python -m pip install --no-cache-dir -r docker/requirements.txt && \
    apk del .build-deps

# Create beets directory structure
RUN mkdir -p /shared/beets && \
    touch /shared/beets/beets-library.blb

###############################################################
## DEVELOPMENT IMAGE                                          #
###############################################################

FROM base AS development

ARG NODE_ENV
ENV NODE_ENV="${NODE_ENV}" \
    ENVIRONMENT="development" \
    VERSION="0.0.0-dev"

# Install dev-only dependencies
RUN apk add --no-cache git && \
    npm install -g tsx

# In dev mode, files are mounted via volume
# No need to copy anything here

EXPOSE 8484 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8484/api/is-auth-active || exit 1

ENTRYPOINT ["sh", "/tidarr/docker/entrypoint.sh"]

###############################################################
## BUILD APP (production only)                                #
###############################################################

FROM --platform=$BUILDPLATFORM ghcr.io/linuxserver/baseimage-alpine:3.21 AS app_builder

WORKDIR /tidarr

ENV SHELL=bash
ARG NODE_ENV
ENV NODE_ENV="${NODE_ENV}"

# Install build dependencies
RUN apk add --no-cache git npm nodejs && \
    npm install -g yarn && \
    rm -rf /var/cache/apk/*

COPY . .

# Install all workspace dependencies at once
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn/v6,sharing=locked \
    yarn install --prefer-offline --frozen-lockfile

# Build frontend and backend
RUN yarn workspace tidarr-react run build && \
    yarn workspace tidarr-api run build

###############################################################
## PRODUCTION IMAGE                                           #
###############################################################

FROM base AS production

ARG VERSION
ENV VERSION=$VERSION

# Copy built artifacts from builder stage
COPY --from=app_builder /tidarr/api/dist /tidarr/api/dist
COPY --from=app_builder /tidarr/api/scripts /tidarr/api/scripts
COPY --from=app_builder /tidarr/app/dist /tidarr/app/build
COPY --from=app_builder /tidarr/settings /tidarr/settings
COPY --from=app_builder /tidarr/.env /tidarr/.env
COPY --from=app_builder /tidarr/docker/entrypoint.sh /tidarr/docker/entrypoint.sh

# Copy workspace configuration and API package files
COPY package.json yarn.lock* ./
COPY api/package.json ./api/package.json

# Install production dependencies and clean up aggressively
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn/v6,sharing=locked \
    mkdir -p /shared/.processing && \
    yarn install --frozen-lockfile --production && \
    npm uninstall -g npm && \
    rm -rf /root/.npm /tmp/* /var/tmp/* && \
    find ./node_modules -type f \( -name '*.d.ts' -o -name '*.md' -o -name '*.map' -o -name 'README*' -o -name 'LICENSE*' -o -name 'CHANGELOG*' \) -delete && \
    find ./node_modules -type d \( -name 'test' -o -name 'tests' -o -name '__tests__' -o -name 'docs' -o -name 'examples' -o -name '.github' \) -exec rm -rf {} + 2>/dev/null || true

EXPOSE 8484

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8484/api/is-auth-active || exit 1

ENTRYPOINT ["sh", "/tidarr/docker/entrypoint.sh"]
