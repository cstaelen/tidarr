IMAGE=cstaelen/tidarr
IMAGE_TAG?=testing
BUILD_VERSION?=0.0.0-prod
PLATFORMS?=linux/amd64,linux/arm64
DOCKERFILE=./docker/Dockerfile
DOCKER_COMPOSE  = $(or docker compose, docker-compose)

##
## Dev 🐳
##-------

dev: ## Boot dev environnement
	$(DOCKER_COMPOSE) down
	$(DOCKER_COMPOSE) up tidarr --build --remove-orphans

install: ## Install deps
	$(DOCKER_COMPOSE) exec tidarr yarn install
##
## Playwright 🚨
##--------------

testing-build: ## Build Tidarr production Docker image for E2E tests
	docker build -t tidarr-prod --target production -f docker/Dockerfile .

testing-install: ## Install Playwright browsers
	cd e2e && npx playwright install

testing-run: ## Run Playwright E2E tests (each test gets isolated container on random port) (arg: f=filter)
	cd e2e && npx playwright test $(f)

testing-update-snapshots: ## Update Playwright snapshots (arg: f=filter)
	cd e2e && npx playwright test $(f) --reporter=list --update-snapshots

testing-show-report: ## Show last playwright report
	cd e2e && npx playwright show-report

testing-clean: ## Clean Playwright reports
	rm -rf playwright-report e2e/playwright-report e2e/test-results

testing-ui: ## Run local Playwright UI
	cd e2e && npx playwright test --ui

##
## Code quality 🧙
##----------------

quality-deadcode: ## Fin deadcode with `ts-prune`
	$(DOCKER_COMPOSE) exec -w /tidarr/api tidarr yarn find-deadcode
	$(DOCKER_COMPOSE) exec -w /tidarr/app tidarr yarn find-deadcode
	$(DOCKER_COMPOSE) exec -w /tidarr/e2e tidarr yarn find-deadcode

quality-depcheck: ## Check dependencies
	$(DOCKER_COMPOSE) exec -w /tidarr/api tidarr yarn depcheck
	$(DOCKER_COMPOSE) exec -w /tidarr/app tidarr yarn depcheck
	$(DOCKER_COMPOSE) exec -w /tidarr/e2e tidarr yarn depcheck

quality-lint: ## Check dependencies
	$(DOCKER_COMPOSE) exec -w /tidarr tidarr yarn eslint

quality-lint-fix: ## Check dependencies
	$(DOCKER_COMPOSE) exec -w /tidarr tidarr yarn eslint-fix

##
## Builder 🚀
##-----------

docker-build:
	docker buildx build --platform ${PLATFORMS} --target production --build-arg VERSION=${BUILD_VERSION} -f ${DOCKERFILE} -t ${IMAGE}:${IMAGE_TAG} .

docker-run: ## Run tidarr docker image
	docker run \
		--rm \
		--name tidarr \
		-p 8484:8484 \
		-v ${PWD}/docker/mnt/config:/shared \
		-v ${PWD}/docker/mnt/library:/music \
		-e ENABLE_BEETS=true \
		-e ENABLE_TIDAL_PROXY=true \
		-e PUID=501 \
		-e PGID=501 \
		-e ADMIN_PASSWORD=tidarr \
	${IMAGE}:${IMAGE_TAG}

##
## Help ℹ️
##--------

help: ## List Makefile commands
	@grep -E '(^[a-zA-Z0-9_-]+:.*?##.*$$)|(^##)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[32m%-30s\033[0m %s\n", $$1, $$2}' | sed -e 's/\[32m##/[33m/'

.DEFAULT_GOAL := help

