IMAGE=cstaelen/tidarr:0.0.1a

build-docker:
	docker build --platform=linux/amd64 -t ${IMAGE} .

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
