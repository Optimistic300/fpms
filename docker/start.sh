#!/bin/sh
set -e

chmod -R 777 /var/www/html/storage
chmod -R 777 /var/www/html/bootstrap/cache

php artisan migrate --force
php artisan db:seed --force

php artisan config:cache
php artisan route:cache
php artisan view:cache

php-fpm -D
nginx -g "daemon off;"
