IMAGE=cstaelen/tidarr
VERSION=0.0.7
DOCKERFILE=./docker/Dockerfile.prod
DOCKER_COMPOSE  = $(or docker compose, docker-compose)

##
## Dev 🐳
##-------

dev: ## Boot dev environnement
	$(DOCKER_COMPOSE) up tidarr --build --remove-orphans --no-recreate

##
## Playwright 🚨
##--------------

testing-build: ## Build container with Playwright tests and production build image
	$(DOCKER_COMPOSE) up -d testing --build --remove-orphans
	$(DOCKER_COMPOSE) exec -w /home/app/build/e2e testing npm install

testing-run: ## Run Playwright tests with production build image (arg: f=filter)
	$(DOCKER_COMPOSE) restart testing
	$(DOCKER_COMPOSE) exec -w /home/app/build/e2e testing npx playwright test $(f)

testing-update-snapshots: ## Update Playwright snapshots
	$(DOCKER_COMPOSE) restart testing
	$(DOCKER_COMPOSE) exec -w /home/app/build/e2e testing npx playwright test --reporter=list --update-snapshots

testing-show-report: ## Show last playwright report
	$(DOCKER_COMPOSE) exec -w /home/app/build/e2e testing npx playwright show-report --host 0.0.0.0

testing-clean: ## Clean Playwright reports
	rm -rf playwright-report e2e/playwright-report e2e/test-results

##
## Code quality 🧙
##----------------

quality-deadcode: ## Fin deadcode with `ts-prune`
	$(DOCKER_COMPOSE) exec -w /home/app/build/api tidarr yarn find-deadcode 
	$(DOCKER_COMPOSE) exec -w /home/app/build/app tidarr yarn find-deadcode 

quality-depcheck: ## Check dependencies
	$(DOCKER_COMPOSE) exec -w /home/app/build/api tidarr yarn depcheck
	$(DOCKER_COMPOSE) exec -w /home/app/build/app tidarr yarn depcheck

quality-lint: ## Check dependencies
	$(DOCKER_COMPOSE) exec -w /home/app/build/api tidarr yarn eslint
	$(DOCKER_COMPOSE) exec -w /home/app/build/app tidarr yarn eslint

quality-lint-fix: ## Check dependencies
	$(DOCKER_COMPOSE) exec -w /home/app/build/api tidarr yarn eslint-fix
	$(DOCKER_COMPOSE) exec -w /home/app/build/app tidarr yarn eslint-fix

##
## Builder 🚀
##-----------

docker-build: ## Build Tidarr docker image
	docker build --platform=linux/amd64 -f ${DOCKERFILE} -t ${IMAGE}:${VERSION} -t ${IMAGE}:latest .

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

##
## Help ℹ️
##--------

help: ## List Makefile commands
	@grep -E '(^[a-zA-Z0-9_-]+:.*?##.*$$)|(^##)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[32m%-30s\033[0m %s\n", $$1, $$2}' | sed -e 's/\[32m##/[33m/'

.DEFAULT_GOAL := help

