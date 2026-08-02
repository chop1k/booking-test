FROM php:8.5-fpm-alpine AS php

ADD --chmod=0755 \
    --checksum=sha256:7c133ae4b9490d912287188c62ea570729cfa74f0ea357e4be672ce696b4aa29 \
    https://github.com/mlocati/docker-php-extension-installer/releases/download/2.11.12/install-php-extensions \
    /usr/local/bin/install-php-extensions

ENV COMPOSER_ALLOW_SUPERUSER=1

RUN mv "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini"

RUN set -eux; \
    install-php-extensions \
        @composer \
        opcache \
        apcu \
        intl \
        curl \
        pdo_pgsql \
    ;

RUN { \
        echo 'opcache.validate_timestamps=1'; \
        echo 'opcache.revalidate_freq=0'; \
    } > "$PHP_INI_DIR/conf.d/zz-dev.ini"

WORKDIR /app

# todo: исправить
# HEALTHCHECK --interval=10s --timeout=5s --start-period=15s \
#     CMD curl -f http://127.0.0.1:2114/api/system/healthcheck || exit 1

CMD ["php-fpm", "-F"]