# FPMS — Forest Research Project Management System

A Laravel + React application for managing forestry research projects, activities, reports, publications, and documents.

## Deployment

### Prerequisites
- PHP 8.4+
- Composer
- MySQL 8.0+ (or MariaDB 10.4+)
- Node.js 22+
- Redis (optional, for cache/queue)

### Steps

```bash
# 1. Install dependencies
composer install --no-interaction --prefer-dist
npm ci --ignore-scripts && npm run build

# 2. Configure environment
cp .env.example .env
# Edit .env with your database credentials, app URL, mail settings, etc.
php artisan key:generate

# 3. Run migrations
php artisan migrate --force

# 4. Create storage link
php artisan storage:link

# 5. Set up scheduler (add to crontab)
# * * * * * cd /path/to/project && php artisan schedule:run >> /dev/null 2>&1

# 6. Set up queue worker (run as daemon/supervisor)
# php artisan queue:work --tries=3 --timeout=90

# 7. Set up web server
# Point your web server to the project's `public/` directory
```

## Backup Strategy

### Database Backup
Daily automated MySQL dumps with 30-day retention. Monthly backups retained for 12 months.

```bash
# Daily backup script — add to crontab
# 0 2 * * * /usr/bin/mysqldump -u root skms | gzip > /backups/skms/daily/skms_$(date +\%Y\%m\%d).sql.gz

# Monthly archival — run on 1st of each month
# 0 3 1 * * cp /backups/skms/daily/skms_$(date +\%Y\%m\%d).sql.gz /backups/skms/monthly/

# Cleanup — remove backups older than 30 days (daily) and 12 months (monthly)
# find /backups/skms/daily -mtime +30 -delete
# find /backups/skms/monthly -mtime +365 -delete
```

### File Storage Backup
- **Development:** Local disk (`storage/app/private`)
- **Production:** S3-compatible storage with cross-region replication
- Enable versioning on the S3 bucket for point-in-time recovery
- Configure lifecycle rules for cost-effective retention

### Point-in-Time Recovery
Ensure MySQL binary logs are enabled (`log_bin`) for point-in-time recovery capability.

## Scheduled Tasks

The following tasks run daily via `php artisan schedule:run`:

- `reports:calculate-overdue` — Identifies overdue reports
- `reports:deadline-alerts` — Generates deadline reminders

## Queue Worker

In production, run the queue worker as a daemon:

```bash
php artisan queue:work --tries=3 --timeout=90
```

For supervisor configuration:

```ini
[program:fpms-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/project/artisan queue:work --tries=3 --timeout=90
autostart=true
autorestart=true
numprocs=2
```

## Testing

```bash
# Backend tests
php artisan test

# Frontend tests (if configured)
npm run test
```
