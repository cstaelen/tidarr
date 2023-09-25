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

RUN yarn install
EXPOSE 8484
ENV PORT 8484

CMD ["yarn", "dev"]
