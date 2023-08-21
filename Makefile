IMAGE=cstaelen/tidarr
VERSION=0.0.1a
DOCKERFILE=./docker/DockerfileBuilder

build-docker:
	docker build --platform=linux/amd64 -f ${DOCKERFILE} -t ${IMAGE}:${VERSION} -t ${IMAGE}:latest .

run-docker:
	docker run  \
		--rm \
		--name tidarr \
		-p 8484:8484 \
		-v ${PWD}/settings/.tidal-dl.token.json:/root/.tidal-dl.token.json \
		-v ${PWD}/settings/.tidal-dl.json:/root/.tidal-dl.json \
		-v ${PWD}/download/albums:/home/app/standalone/download/albums \
		-v ${PWD}/download/tracks:/home/app/standalone/download/tracks \
	${IMAGE}

dev:
	docker-compose build && docker-compose up