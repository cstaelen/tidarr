WORKDIR /home/app/build

ENV SHELL bash
ARG NODE_ENV
ENV NODE_ENV="${NODE_ENV}"

RUN apk add git npm nodejs

COPY . .

RUN npm install -g yarn
RUN \
      --mount=type=cache,target=/usr/local/share/.cache/yarn/v6,sharing=locked \
      yarn --prefer-offline --frozen-lockfile

RUN yarn front-build
RUN yarn api-build