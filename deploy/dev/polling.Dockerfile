FROM php:8.4-cli-alpine

ADD --chmod=0755 \
    https://github.com/mlocati/docker-php-extension-installer/releases/download/2.11.12/install-php-extensions \
    /usr/local/bin/install-php-extensions

RUN apk add --no-cache \
        curl \
    && install-php-extensions \
        curl \
        pcntl

WORKDIR /app

RUN mv "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini"

CMD ["php", "/app/polling"]
