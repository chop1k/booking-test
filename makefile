# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# PHP & Tools
# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
PHP_INTERPRETER          := /usr/bin/php
PHP_TESTING_TOOL         := vendor/bin/testo
PHP_CODE_QUALITY_TOOL    := vendor/bin/php-cs-fixer
PHP_STATIC_ANALYSIS_TOOL := vendor/bin/psalm

# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# Application - Sources
# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
APP_SOURCES_DIR         = src
APP_SOURCES_TESTING_DIR = tests
APP_BUILD_DIR           = dist

# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# Application - Testing
# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# Application - Code quality
# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
CODE_QUALITY_CONFIG          := .php-cs-fixer.php

# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# PHONY & such
# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
PHONY_TARGETS  = all
PHONY_TARGETS += all-tests all-code all-fonts
PHONY_TARGETS += tests-e2e tests-unit tests-coverage
PHONY_TARGETS += code-style code-inspect
PHONY_TARGETS += help

.PHONY: $(PHONY_TARGETS)

all: all-fonts all-code all-tests

all-tests: tests-e2e tests-unit tests-coverage

all-code: code-style code-inspect

tests-e2e:
	$(PHP_INTERPRETER) $(PHP_TESTING_TOOL) \
		--testsuite=e2e

tests-unit:
	$(PHP_INTERPRETER) $(PHP_TESTING_TOOL) \
		--testsuite=unit

tests-coverage:

code-style:
	$(PHP_INTERPRETER) $(PHP_CODE_QUALITY_TOOL) \
		--config=$(CODE_QUALITY_CONFIG)         \
		fix                                     \
		$(APP_SOURCES_DIR)                      \
		$(APP_SOURCES_TESTING_DIR)

code-inspect:
	$(PHP_INTERPRETER) $(PHP_STATIC_ANALYSIS_TOOL)

help:
	@echo "help"
