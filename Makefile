IMAGE=cstaelen/tidarr
VERSION=0.0.7
DOCKERFILE=./docker/Dockerfile.prod
DOCKER_COMPOSE  = $(or docker compose, docker-compose)

##
## Dev 🐳
##-------

dev: ## Boot dev environnement
	$(DOCKER_COMPOSE) up tidarr --build --remove-orphans --no-recreate
.PHONY: dev

##
## Playwright 🚨
##--------------

testing-build: ## Build container with Playwright tests and production build image
	$(DOCKER_COMPOSE) up -d testing --build --remove-orphans
.PHONY: testing-build

testing-run: ## Run Playwright tests with production build image
	$(DOCKER_COMPOSE) exec -w /home/app/standalone/E2E testing npx playwright test
.PHONY: testing-run

testing-clean: ## Clean Playwright reports
	rm -rf playwright-report E2E/playwright-report E2E/test-results
.PHONY: testing-clean

##
## Code quality 🚀
##----------------

quality-deadcode: ## Fin deadcode with `ts-prune`
	$(DOCKER_COMPOSE) exec tidarr yarn find-deadcode 
.PHONY: quality-deadcode

quality-depcheck: ## Check dependencies
	$(DOCKER_COMPOSE) exec tidarr yarn depcheck
.PHONY: quality-depcheck

quality-lint: ## Check dependencies
	$(DOCKER_COMPOSE) exec tidarr yarn eslint
.PHONY: quality-lint

quality-lint-fix: ## Check dependencies
	$(DOCKER_COMPOSE) exec tidarr yarn eslint-fix
.PHONY: quality-lint-fix

##
## Builder 🚀
##-----------

docker-build: ## Build Tidarr docker image
	docker build --platform=linux/amd64 -f ${DOCKERFILE} -t ${IMAGE}:${VERSION} -t ${IMAGE}:latest .
.PHONY: docker-build

docker-run: ## Run tidarr docker image
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
.PHONY: docker-run

##
## Help ℹ️
##--------

help: ## List Makefile commands
	@grep -E '(^[a-zA-Z0-9_-]+:.*?##.*$$)|(^##)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[32m%-30s\033[0m %s\n", $$1, $$2}' | sed -e 's/\[32m##/[33m/'
.PHONY: help

.DEFAULT_GOAL := help

