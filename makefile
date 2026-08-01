# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# PHP & Tools
# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
PHP_INTERPRETER          := /usr/bin/php
PHP_TESTING_TOOL         := vendor/bin/testo
PHP_CODE_QUALITY_TOOL    := vendor/bin/php-cs-fixer
PHP_STATIC_ANALYSIS_TOOL := vendor/bin/psalm
DOCKER_BIN               := docker

# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# Application - Sources
# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
APP_ROOT                = .
APP_SOURCES_DIR         = src
APP_SOURCES_TESTING_DIR = tests
APP_BUILD_DIR           = dist

# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# Application - Releasing
# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
APP_RELEASE = dev

# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# Application - Code quality
# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
CODE_QUALITY_CONFIG          := .php-cs-fixer.php

# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# Application - Deploy
# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
DEPLOY_COMPOSE_NAME            = compose.yaml
DEPLOY_APP_DOCKERFILE_NAME     = app.Dockerfile
DEPLOY_POLLING_DOCKERFILE_NAME = polling.Dockerfile
DEPLOY_TESTO_DOCKERFILE_NAME   = testo.Dockerfile
DEPLOY_DOCKERIGNORE_NAME       = .dockerignore

DEPLOY_DIR                     = $(APP_ROOT)/deploy

# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# PHONY & such
# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
PHONY_TARGETS  = all
PHONY_TARGETS += all-tests all-code
PHONY_TARGETS += tests-e2e
PHONY_TARGETS += code-style code-inspect
PHONY_TARGETS += deploy-dev deploy-prod deploy-test
PHONY_TARGETS += run-docker
PHONY_TARGETS += help

.PHONY: $(PHONY_TARGETS)
.DEFAULT_GOAL := help

all: all-code all-tests

all-tests: tests-e2e

all-code: code-style code-inspect

tests-e2e:
	$(PHP_INTERPRETER) $(PHP_TESTING_TOOL) \
		--suite=e2e

code-style:
	$(PHP_INTERPRETER) $(PHP_CODE_QUALITY_TOOL) \
		--config=$(CODE_QUALITY_CONFIG)         \
		fix                                     \
		$(APP_SOURCES_DIR)                      \
		$(APP_SOURCES_TESTING_DIR)

code-inspect:
	$(PHP_INTERPRETER) $(PHP_STATIC_ANALYSIS_TOOL)

run-docker: deploy-$(APP_RELEASE)
	$(DOCKER_BIN) compose up

deploy-dev:
	cp $(DEPLOY_DIR)/dev/$(DEPLOY_COMPOSE_NAME) $(DEPLOY_COMPOSE_NAME)
	cp $(DEPLOY_DIR)/dev/$(DEPLOY_APP_DOCKERFILE_NAME) $(DEPLOY_APP_DOCKERFILE_NAME)
	cp $(DEPLOY_DIR)/dev/$(DEPLOY_POLLING_DOCKERFILE_NAME) $(DEPLOY_POLLING_DOCKERFILE_NAME)
	cp $(DEPLOY_DIR)/dev/$(DEPLOY_DOCKERIGNORE_NAME) $(DEPLOY_DOCKERIGNORE_NAME)

deploy-prod:
	cp $(DEPLOY_DIR)/prod/$(DEPLOY_COMPOSE_NAME) $(DEPLOY_COMPOSE_NAME)
	cp $(DEPLOY_DIR)/prod/$(DEPLOY_APP_DOCKERFILE_NAME) $(DEPLOY_APP_DOCKERFILE_NAME)
	cp $(DEPLOY_DIR)/prod/$(DEPLOY_POLLING_DOCKERFILE_NAME) $(DEPLOY_POLLING_DOCKERFILE_NAME)
	cp $(DEPLOY_DIR)/prod/$(DEPLOY_DOCKERIGNORE_NAME) $(DEPLOY_DOCKERIGNORE_NAME)

deploy-test:
	cp $(DEPLOY_DIR)/test/$(DEPLOY_COMPOSE_NAME) $(DEPLOY_COMPOSE_NAME)
	cp $(DEPLOY_DIR)/test/$(DEPLOY_APP_DOCKERFILE_NAME) $(DEPLOY_APP_DOCKERFILE_NAME)
	cp $(DEPLOY_DIR)/test/$(DEPLOY_TESTO_DOCKERFILE_NAME) $(DEPLOY_TESTO_DOCKERFILE_NAME)
	cp $(DEPLOY_DIR)/test/$(DEPLOY_DOCKERIGNORE_NAME) $(DEPLOY_DOCKERIGNORE_NAME)

clean: clean-$(APP_RELEASE)

clean-dev:
	rm $(DEPLOY_COMPOSE_NAME)
	rm $(DEPLOY_APP_DOCKERFILE_NAME)
	rm $(DEPLOY_POLLING_DOCKERFILE_NAME)
	rm $(DEPLOY_DOCKERIGNORE_NAME)

clean-prod:
	rm $(DEPLOY_COMPOSE_NAME)
	rm $(DEPLOY_APP_DOCKERFILE_NAME)
	rm $(DEPLOY_POLLING_DOCKERFILE_NAME)
	rm $(DEPLOY_DOCKERIGNORE_NAME)

clean-test:
	rm $(DEPLOY_COMPOSE_NAME)
	rm $(DEPLOY_APP_DOCKERFILE_NAME)
	rm $(DEPLOY_TESTO_DOCKERFILE_NAME)
	rm $(DEPLOY_DOCKERIGNORE_NAME)

help:
help:
	@echo "Доступные команды:"
	@echo ""
	@echo "  make all           - выполнить всё: стиль, стат. анализ и e2e-тесты"
	@echo "  make all-code      - проверить/поправить стиль кода и стат. анализ"
	@echo "  make all-tests     - прогнать все тесты"
	@echo ""
	@echo "  make code-style    - автоматически поправить стиль кода (php-cs-fixer)"
	@echo "  make code-inspect  - статический анализ кода (psalm)"
	@echo ""
	@echo "  make tests-e2e     - прогнать e2e-тесты (testo)"
	@echo ""
	@echo "  make deploy-dev    - разложить deploy-файлы для окружения dev"
	@echo "  make deploy-prod   - разложить deploy-файлы для окружения prod"
	@echo "  make deploy-test   - разложить deploy-файлы для окружения test"
	@echo "  make run-docker    - собрать deploy-файлы под APP_RELEASE и поднять docker compose"
	@echo ""
	@echo "  make clean         - почистить перемещённые файлы, артефакты сборки и т.д. для текущего окружения"
	@echo "  make clean-dev     - почистить перемещённые файлы, артефакты сборки и т.д. для dev"
	@echo "  make clean-prod    - почистить перемещённые файлы, артефакты сборки и т.д. для prod"
	@echo "  make clean-test    - почистить перемещённые файлы, артефакты сборки и т.д. для test"
	@echo ""
	@echo "  make help          - показать это сообщение"
	@echo ""
	@echo "Переменные:"
	@echo "  APP_RELEASE=dev|prod|test  (сейчас: $(APP_RELEASE)) - используется в run-docker и clean"