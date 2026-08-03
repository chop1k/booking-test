FROM php:8.5-fpm-alpine

ADD --chmod=0755 \
    --checksum=sha256:7c133ae4b9490d912287188c62ea570729cfa74f0ea357e4be672ce696b4aa29 \
    https://github.com/mlocati/docker-php-extension-installer/releases/download/2.11.12/install-php-extensions \
    /usr/local/bin/install-php-extensions

ENV COMPOSER_ALLOW_SUPERUSER=1

RUN install-php-extensions \
        @composer \
        opcache \
        apcu \
        intl \
        pdo_pgsql \
        redis

WORKDIR /app

COPY . .

RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

RUN composer install \
        --no-dev \
        --prefer-dist \
        --no-interaction \
        --optimize-autoloader \
    && composer dump-env prod \
    && mkdir -p var/data \
    && mkdir -p var/cache/prod \
    && mkdir -p var/log

RUN php bin/console importmap:install \
    && php bin/console asset-map:compile

CMD ["sh", "-c", "php bin/console cache:warmup && php bin/console doctrine:migrations:migrate --allow-no-migration --no-interaction && php-fpm -F"]