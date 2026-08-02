#!/bin/sh
set -e

# Fix permissions
chmod -R 777 /var/www/html/storage
chmod -R 777 /var/www/html/bootstrap/cache

# Run migrations
php artisan migrate --force

# Cache
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start services
php-fpm -D
sleep 1
nginx -g "daemon off;"
