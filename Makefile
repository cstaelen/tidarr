IMAGE=cstaelen/tidarr
VERSION=0.0.1a
DOCKERFILE=./docker/DockerfileBuilder

build-docker:
	docker build --platform=linux/amd64 -f ${DOCKERFILE} -t ${IMAGE}:${VERSION} -t ${IMAGE}:latest .

run-docker:
	docker run  \
		--rm \
		--name tidarr \
		-p 3000:3000 \
		-f ${DOCKERFILE} \
		-v .:/usr/tidarr \
		-v ${PWD}/settings/.tidal-dl.token.json:/root/.tidal-dl.token.json \
		-v ${PWD}/settings/.tidal-dl.json:/root/.tidal-dl.json \
		-v ${PWD}/download:/usr/tidarr/download \
	${IMAGE}

dev:
	docker-compose build && docker-compose up