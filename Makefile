IMAGE=cstaelen/tidarr
VERSION=0.0.6
DOCKERFILE=./docker/Dockerfile.builder

DOCKER_COMPOSE  = $(or docker compose, docker-compose)

#LOCALIP=$(ifconfig | awk '/inet /&&!/127.0.0.1/{print $2;exit}')
LOCALIP=127.0.0.1

##
## Dev 🐳
##-----------

dev: ## Boot dev environnement
	$(DOCKER_COMPOSE) up --build --remove-orphans --no-recreate
.PHONY: dev

##
## Playwright 🐳
##-----------

testing: ## Run Playwright tests
	$(DOCKER_COMPOSE) up -d testing --build --remove-orphans
	$(DOCKER_COMPOSE) exec -w /home/app/standalone/E2E testing npx playwright test
.PHONY: testing

testing-ui: ## Run Playwright tests with UI
	xhost +${LOCALIP}
	docker run \
		-it \
		--rm \
		--ipc host \
		--net host \
		-e DISPLAY=${LOCALIP}:0 \
		-e XAUTHORITY=/.Xauthority  \
		-v=".:/srv/" \
		-v /tmp/.X11-unix:/tmp/.X11-unix \
		-v ~/.Xauthority:/.Xauthority  \
		-w /srv/E2E \
		mcr.microsoft.com/playwright:v1.43.0-jammy \
		npx playwright test --ui
.PHONY: testing-ui

clean-reports: ## Clean Playwright reports
	rm -rf playwright-report E2E/playwright-report E2E/test-results
.PHONY: clean-reports

##
## Builder 🚀
##----------	

build-docker: ## Build Tidarr docker image
	docker build --platform=linux/amd64 -f ${DOCKERFILE} -t ${IMAGE}:${VERSION} -t ${IMAGE}:latest .
.PHONY: build-docker

run-docker: ## Run tidarr docker image
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
.PHONY: run-docker

##
## Help ℹ️
##-------

help: ## List Makefile commands
	@grep -E '(^[a-zA-Z0-9_-]+:.*?##.*$$)|(^##)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[32m%-30s\033[0m %s\n", $$1, $$2}' | sed -e 's/\[32m##/[33m/'
.PHONY: help

.DEFAULT_GOAL := help

