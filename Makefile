IMAGE=cstaelen/tidarr
VERSION=testing
DOCKERFILE=./docker/Dockerfile.prod
DOCKER_COMPOSE  = $(or docker compose, docker-compose)

##
## Dev 🐳
##-------

dev: ## Boot dev environnement
	$(DOCKER_COMPOSE) up tidarr --build --remove-orphans

install: ## Install deps
	$(DOCKER_COMPOSE) exec -w /home/app/standalone/api tidarr yarn install
	$(DOCKER_COMPOSE) exec -w /home/app/standalone/app tidarr yarn install
	$(DOCKER_COMPOSE) exec -w /home/app/standalone/e2e tidarr yarn install
##
## Playwright 🚨
##--------------

testing-build: ## Build container with Playwright tests and production build image
	$(DOCKER_COMPOSE) up -d testing --build --remove-orphans
	$(DOCKER_COMPOSE) exec -w /home/app/standalone/e2e testing yarn install

testing-run: ## Run Playwright tests with production build image (arg: f=filter)
	$(DOCKER_COMPOSE) restart testing
	$(DOCKER_COMPOSE) exec -w /home/app/standalone/e2e testing npx playwright test $(f)

testing-update-snapshots: ## Update Playwright snapshots (arg: f=filter)
	$(DOCKER_COMPOSE) restart testing
	$(DOCKER_COMPOSE) exec -w /home/app/standalone/e2e testing npx playwright test $(f) --reporter=list --update-snapshots

testing-show-report: ## Show last playwright report
	$(DOCKER_COMPOSE) exec -w /home/app/standalone/e2e testing npx playwright show-report --host 0.0.0.0

testing-clean: ## Clean Playwright reports
	rm -rf playwright-report e2e/playwright-report e2e/test-results

testing-ui: ## Run local Playwright UI
	yarn --cwd ./e2e playwright:test-ui

##
## Code quality 🧙
##----------------

quality-deadcode: ## Fin deadcode with `ts-prune`
	$(DOCKER_COMPOSE) exec -w /home/app/standalone/api tidarr yarn find-deadcode
	$(DOCKER_COMPOSE) exec -w /home/app/standalone/app tidarr yarn find-deadcode
	$(DOCKER_COMPOSE) exec -w /home/app/standalone/e2e tidarr yarn find-deadcode

quality-depcheck: ## Check dependencies
	$(DOCKER_COMPOSE) exec -w /home/app/standalone/api tidarr yarn depcheck
	$(DOCKER_COMPOSE) exec -w /home/app/standalone/app tidarr yarn depcheck
	$(DOCKER_COMPOSE) exec -w /home/app/standalone/e2e tidarr yarn depcheck

quality-lint: ## Check dependencies
	$(DOCKER_COMPOSE) exec -w /home/app/standalone tidarr yarn eslint

quality-lint-fix: ## Check dependencies
	$(DOCKER_COMPOSE) exec -w /home/app/standalone tidarr yarn eslint-fix

##
## Builder 🚀
##-----------

docker-build: ## Build Tidarr docker image
	docker build --build-arg VERSION=0.0.0-prod -f ${DOCKERFILE} -t ${IMAGE}:${VERSION} .

docker-run: ## Run tidarr docker image
	docker run \
		--rm \
		--name tidarr \
		-p 8484:8484 \
		-v ${PWD}/docker/mnt/config:/home/app/standalone/shared \
		-v ${PWD}/docker/mnt/library:/home/app/standalone/library \
		-e ENABLE_BEETS=true \
		-e ENABLE_TIDAL_PROXY=true \
		-e PUID=501 \
		-e PGID=501 \
		-e ADMIN_PASSWORD=tidarr \
	${IMAGE}:${VERSION}

##
## Help ℹ️
##--------

help: ## List Makefile commands
	@grep -E '(^[a-zA-Z0-9_-]+:.*?##.*$$)|(^##)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[32m%-30s\033[0m %s\n", $$1, $$2}' | sed -e 's/\[32m##/[33m/'

.DEFAULT_GOAL := help

