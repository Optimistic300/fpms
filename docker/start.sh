#!/bin/sh
set -e

# Fix permissions
chmod -R 777 /var/www/html/storage
chmod -R 777 /var/www/html/bootstrap/cache

# Run migrations
php artisan migrate --force

# Seed reference data (divisions, activity types) - idempotent, safe to
# rerun on every boot (Render free tier respins the container on cold starts)
php artisan db:seed --force

# Move anything still on a legacy placeholder division to Administration,
# then remove the legacy rows - no-op once none remain
php artisan db:seed --class=Database\\Seeders\\CleanupLegacyDivisionsSeeder --force

# Create the admin account on first deploy (no-op if it already exists,
# or if ADMIN_EMAIL / ADMIN_PASSWORD aren't set)
php artisan db:seed --class=Database\\Seeders\\AdminUserSeeder --force

# Cache
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start services
php-fpm -D
sleep 1
nginx -g "daemon off;"
