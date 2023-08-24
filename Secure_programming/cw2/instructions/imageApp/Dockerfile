FROM php:7.2-apache
COPY --chown=www-data:www-data srv/http/ /var/www/html
RUN chmod -R 765 /var/www/html
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"
