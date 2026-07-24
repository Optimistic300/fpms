# Deployment Guide

## Primary Platform: cPanel

SKMS is deployed on cPanel shared hosting as the primary production platform.

### Prerequisites

- PHP 8.4+ (configured via cPanel's MultiPHP Manager)
- MySQL 8.0+ (managed via cPanel's phpMyAdmin or remote connection)
- Apache with `mod_rewrite` enabled (default on cPanel)
- Composer (available via cPanel's Terminal or SSH)

### Deployment Steps

1. **Upload code** via cPanel's File Manager, Git Version Control, or FTP to the document root (e.g., `public_html/skms`).

2. **Configure environment** — Copy `.env.example` to `.env` and update:
   - `APP_URL` — production URL
   - `APP_DEBUG=false`
   - `DB_*` — MySQL credentials from cPanel's MySQL Databases
   - `QUEUE_CONNECTION=database`
   - `FILESYSTEM_DISK=local` (or `s3` if S3-compatible storage is available)

3. **Set document root** — Point the domain/subdomain to `skms/public/` in cPanel's Domain settings (or use a `.htaccess` rewrite).

4. **Run migrations** via cPanel Terminal or SSH:
   ```bash
   php artisan migrate --force
   php artisan db:seed --force
   ```

5. **Set up the scheduler** — Add the following cron job in cPanel's Cron Jobs interface:
   ```cron
   * * * * * php /path/to/skms/artisan schedule:run >> /dev/null 2>&1
   ```

6. **Storage link** (if using local disk):
   ```bash
   php artisan storage:link
   ```

### Queue Worker

The `database` queue driver is used (no Redis required). The scheduler runs `php artisan queue:work --stop-when-empty` every minute via the cron entry above, processing queued jobs (file indexing, AI retrieval) in the background.

### File Permissions

Ensure the following directories are writable by the web server:
- `storage/`
- `bootstrap/cache/`

## Alternative: Docker Deployment

For staging, CI, or alternative hosting environments, a Docker setup is available.

### Docker Compose

See `docker-compose.yml` at the project root for a complete stack:
- PHP 8.4-FPM + Apache/Nginx
- MySQL 8.0
- Laravel application container

### Building

```bash
docker compose build
docker compose up -d
docker compose exec app php artisan migrate --force
docker compose exec app php artisan db:seed --force
```

## Local Development

XAMPP is the recommended local development environment, providing PHP 8.2+, Apache, and MySQL — matching the cPanel production stack.

1. Clone the repo into XAMPP's `htdocs/` directory
2. Start Apache and MySQL via XAMPP Control Panel
3. Run `composer install && npm install`
4. Copy `.env.example` to `.env` with local database credentials
5. Run `php artisan migrate --seed`
6. Run `npm run dev` for frontend hot-reloading
7. Access at `http://localhost/skms/public`
