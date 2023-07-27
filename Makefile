IMAGE=cstaelen/tidarr:0.0.1a
# IMAGE=therumbler/tidal-dl-web.slim
build-docker:
	docker build -t ${IMAGE} .

run-docker:
	docker run  \
		--rm \
		--name tidarr \
		-p 3000:3000 \
		-v .:/usr/tidarr \
		-v ${PWD}/settings/.tidal-dl.token.json:/root/.tidal-dl.token.json \
		-v ${PWD}/settings/.tidal-dl.json:/root/.tidal-dl.json \
		-v ${PWD}/download:/usr/tidarr/download \
	${IMAGE}

run-dev:
	yarn dev -o
