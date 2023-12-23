IMAGE=cstaelen/tidarr
VERSION=0.0.4
DOCKERFILE=./docker/builder.Dockerfile

dev:
	docker compose up --build

build-docker:
	docker build --platform=linux/amd64 -f ${DOCKERFILE} -t ${IMAGE}:${VERSION} -t ${IMAGE}:latest .

run-docker:
	docker run \
		--rm \
		--name tidarr \
		--platform=linux/amd64 \
		-p 8484:8484 \
		-v ${PWD}/docker/mnt/config/:/home/app/standalone/shared \
		-v ${PWD}/docker/mnt/download/albums:/home/app/standalone/download/albums \
		-v ${PWD}/docker/mnt/download/tracks:/home/app/standalone/download/tracks \
		-e ENABLE_BEETS=true \
		-e PUID=501 \
		-e PGID=501 \
	${IMAGE}