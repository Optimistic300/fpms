#!/bin/sh
set -e

mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache storage/logs
chown -R www-data:www-data storage bootstrap/cache

# Config/route/view caches need env vars available at runtime (not build time),
# so they're built here instead of in the Dockerfile.
php artisan config:cache
php artisan route:cache
php artisan view:cache

php artisan migrate --force

php-fpm -D
nginx -g "daemon off;"
