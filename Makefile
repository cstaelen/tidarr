IMAGE=cstaelen/tidarr
VERSION=0.0.1a
DOCKERFILE=./docker/builder.Dockerfile

build-docker:
	docker build --platform=linux/amd64 -f ${DOCKERFILE} -t ${IMAGE}:${VERSION} -t ${IMAGE}:latest .

run-docker:
	docker run  \
		--rm \
		--name tidarr \
		-p 8484:8484 \
		-v ${PWD}/docker/mnt/config/:/home/app/standalone/shared \
		-v ${PWD}/docker/mnt/download/albums:/home/app/standalone/download/albums \
		-v ${PWD}/docker/mnt/download/tracks:/home/app/standalone/download/tracks \
		-e ENABLE_BEETS=true \
	${IMAGE}

dev:
	docker-compose build && docker-compose up