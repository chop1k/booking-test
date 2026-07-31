# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# PHP & Tools
# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
PHP_INTERPRETER          := /usr/bin/php
PHP_TESTING_TOOL         := vendor/bin/testo
PHP_CODE_QUALITY_TOOL    := vendor/bin/php-cs-fixer
PHP_STATIC_ANALYSIS_TOOL := vendor/bin/psalm

DOCKER_BIN = docker

# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# Application - Sources
# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
APP_ROOT                = .
APP_SOURCES_DIR         = src
APP_SOURCES_TESTING_DIR = tests
APP_BUILD_DIR           = dist

APP_RELEASE = prod

# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# Application - Testing
# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# Application - Code quality
# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
CODE_QUALITY_CONFIG          := .php-cs-fixer.php

# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# Application - Deploy
# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
DEPLOY_DIR = deploy

COMPOSE_FILE = $(APP_ROOT)/compose.yaml
DEPLOYED_DOCKERFILE = $(APP_ROOT)/Dockerfile
# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# PHONY & such
# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
PHONY_TARGETS  = all
PHONY_TARGETS += all-tests all-code all-fonts
PHONY_TARGETS += tests-e2e tests-unit tests-coverage
PHONY_TARGETS += code-style code-inspect
PHONY_TARGETS += deploy-dev deploy-prod deploy-test
PHONY_TARGETS += run-docker run-composer
PHONY_TARGETS += help

.PHONY: $(PHONY_TARGETS)

all: all-fonts all-code all-tests

all-tests: tests-e2e tests-unit tests-coverage

all-code: code-style code-inspect

tests-e2e:
	$(PHP_INTERPRETER) $(PHP_TESTING_TOOL) \
		--suite=e2e

tests-unit:
	$(PHP_INTERPRETER) $(PHP_TESTING_TOOL) \
		--suite=unit

tests-coverage:

code-style:
	$(PHP_INTERPRETER) $(PHP_CODE_QUALITY_TOOL) \
		--config=$(CODE_QUALITY_CONFIG)         \
		fix                                     \
		$(APP_SOURCES_DIR)                      \
		$(APP_SOURCES_TESTING_DIR)

code-inspect:
	$(PHP_INTERPRETER) $(PHP_STATIC_ANALYSIS_TOOL)

deploy-prod:
	cp $(DEPLOY_DIR)/prod/compose.yaml $(COMPOSE_FILE)
	cp $(DEPLOY_DIR)/prod/Dockerfile $(DEPLOYED_DOCKERFILE)
	cp $(DEPLOY_DIR)/prod/.dockerignore .dockerignore

deploy-test:
	cp $(DEPLOY_DIR)/test/compose.yaml $(COMPOSE_FILE)
	cp $(DEPLOY_DIR)/test/Dockerfile $(DEPLOYED_DOCKERFILE)

run-compose: run-docker

run-docker: application-compose
	$(DOCKER_BIN) compose up

application-compose: deploy-$(APP_RELEASE)

help:
	@echo "help"
