FROM node:20-alpine AS base

# update and install dependency
RUN apk update && apk upgrade

RUN apk add git
RUN apk add build-base

ENV PYTHONUNBUFFERED=1
RUN apk add --update --no-cache python3 py3-pip && ln -sf python3 /usr/bin/python
RUN python3 -m pip install --no-cache --upgrade pip setuptools wheel
RUN python3 -m pip install --no-cache --upgrade tidal-dl

# copy the app, note .dockerignore
WORKDIR /app
COPY package.json ./
COPY yarn.lock ./
RUN yarn install
COPY . .
RUN yarn build
COPY . .

EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000

CMD [ "yarn", "start"]
