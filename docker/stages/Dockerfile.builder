WORKDIR /home/app/build

ENV SHELL bash
ARG NODE_ENV
ENV NODE_ENV="${NODE_ENV}"

RUN apk add git npm nodejs ffmpeg
RUN npm install -g yarn

COPY . .

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