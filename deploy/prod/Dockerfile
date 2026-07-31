FROM php:8.4-fpm-alpine

ADD --chmod=0755 \
    https://github.com/mlocati/docker-php-extension-installer/releases/download/2.11.12/install-php-extensions \
    /usr/local/bin/install-php-extensions

ENV COMPOSER_ALLOW_SUPERUSER=1

RUN apk add --no-cache \
        curl \
    && install-php-extensions \
        @composer \
        opcache \
        apcu \
        intl \
        sqlite3 \
        pdo_sqlite

WORKDIR /app

COPY . .

RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

RUN composer install \
        --no-dev \
        --prefer-dist \
        --no-interaction \
        --optimize-autoloader \
    && composer dump-env prod \
    && mkdir -p var/data

RUN php bin/console cache:warmup \
    && php bin/console importmap:install \
    && php bin/console asset-map:compile

CMD ["php-fpm", "-F"]