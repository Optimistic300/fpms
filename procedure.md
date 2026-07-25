# FPMS Local Setup on XAMPP — Procedure & Rationale

This document records what was broken in the local XAMPP setup for this project, what was
changed to fix it, and why — so the same steps can be repeated (or understood) on another
machine.

## 1. Build was failing: missing `resources/js/app.jsx`

**Symptom:** Vite build failed because `resources/js/app.jsx` (lowercase) didn't exist —
only `App.jsx` (capital A) was present.

**Investigation:**
- `vite.config.js` and `resources/views/welcome.blade.php` both already referenced
  `resources/js/app.jsx` (lowercase) as the entry point.
- The existing `App.jsx` did **not** contain a root component. It contained entry-point
  code (service worker registration, `createRoot(...).render(<App/>)`, an `online` event
  listener) and did `import App from './App'` — a **self-import**, since the base name
  `App` resolves to the same file regardless of case.
- Root cause: this directory has **case-sensitivity disabled** on this Windows/NTFS volume
  (confirmed via `fsutil file queryCaseSensitiveInfo`), so `App.jsx` and `app.jsx` were
  literally the same file on disk, not two. Attempting to enable per-directory case
  sensitivity (`fsutil file setCaseSensitiveInfo ... enable`) failed with Access Denied
  (requires admin).
- There was also **no actual root router component** anywhere in the codebase, despite
  `AppShell.jsx`, `ProtectedRoute`/`PublicRoute`, `AuthContext`, and 20 page components
  under `resources/js/pages/` all expecting one (react-router-dom `Outlet`, `Navigate`,
  role-based redirects, etc.). It appears to have been lost/never committed.

**Fix:**
1. Renamed the single physical file to lowercase `resources/js/app.jsx` (matches what
   `vite.config.js`/`welcome.blade.php` already expected) and kept it as the thin entry
   point (service worker + `online` listeners + `createRoot().render()`).
2. Created `resources/js/AppRoot.jsx` as the actual root component — a distinct filename
   to avoid any future case-collision — containing:
   - `BrowserRouter` + `AuthProvider`
   - `/login` behind `PublicRoute`
   - Every other route behind `ProtectedRoute` + `AppShell` (layout with `Outlet`)
   - A route for each of the 20 pages in `resources/js/pages/`, with paths inferred from
     the existing `navigate()`/`<Link to>` calls already present in those page files
     (e.g. `/projects/:id`, `/projects/:id/preview`, `/queue/:reportId`,
     `/reports/:reportId` reusing the `ReportReview` component).
3. `app.jsx` now does `import App from './AppRoot'` instead of the old self-import.
4. Verified with `npm run build` — succeeds (161 modules transformed, output in
   `public/build/`).

## 2. No sign-up / self-registration (confirmed by design, not a bug)

Checked both frontend and backend:
- No `Register`/`Signup` page under `resources/js/pages/`.
- `routes/auth.php` only defines `POST /auth/login`, `POST /auth/forgot-password`,
  `POST /auth/reset-password`, `POST /auth/logout`, `GET /auth/validate` — no
  `register` route.
- New accounts are instead created by an ADMIN via the User Management page
  (`resources/js/pages/UserManagement.jsx`, route `/users`), backed by `UserFormModal`.

This is appropriate for an internal, role-based institutional system (roles: `ADMIN`,
`DIVISION_HEAD`, `SECRETARY`, `MANAGEMENT`, `RESEARCHER`, `STUDENT`) — self-registration
would require either defaulting to a low-privilege role or trusting client input for
role/division assignment, both worse than admin provisioning for this use case.

## 3. No default admin account existed

**Investigation:** `database/seeders/DatabaseSeeder.php` only seeds `Divisions` and
`ActivityTypes` — it never creates a `User`. `UserFactory` has an `admin()` state but
nothing invokes it by default. Result: a fresh DB has zero users and, per (2) above, no
way to create one through the UI.

**Fix:** Created the first admin manually via `php artisan tinker` (password passed as
plain text, since the `User` model casts `password` as `'hashed'` and auto-hashes on
save — pre-hashing it manually would double-hash and break login):

```bash
php artisan migrate --seed   # ensure tables + Divisions/ActivityTypes exist first

php artisan tinker --execute="\App\Models\User::create(['full_name'=>'Admin User','email'=>'admin@example.com','password'=>'password123','role'=>'ADMIN','division_id'=>\App\Models\Division::first()->id,'is_active'=>true,'avatar_initials'=>'AU']);"
```

Verified the row and password hash directly before touching the UI:

```bash
php artisan tinker --execute="dd(\App\Models\User::where('email','admin@example.com')->first());"
php artisan tinker --execute="var_dump(Hash::check('password123', \App\Models\User::where('email','admin@example.com')->first()->password));"
```

Also verified the login endpoint directly (bypassing the browser) using `php artisan
serve` + `curl -X POST http://127.0.0.1:8000/api/auth/login ...`, which returned a valid
token/user JSON — confirming the backend auth logic worked before debugging the frontend.

## 4. Browser login failed with 404, even though curl worked

**Symptom:** `http://localhost/login` rendered fine and accepted the same credentials that
worked via curl against `php artisan serve`, but the UI showed "Login failed. Please try
again." DevTools Network tab showed the `POST` to the login API returning **404**.

**Investigation:**
- `resources/js/api/axios.js` uses `baseURL: '/api'` — root-relative, so it only resolves
  correctly if the site is served from the domain root.
- Checked XAMPP's Apache config: `DocumentRoot` in `C:/xampp/apache/conf/httpd.conf` was
  the default `C:/xampp/htdocs` — **not** `fpms-main/public`. There was no vhost and no
  `.htaccess` at the `htdocs` root routing requests into the Laravel app.
- Confirmed Laravel's own routing was fine: `bootstrap/app.php` registers
  `routes/api.php` (which `require`s `routes/auth.php`) under the automatic `api` prefix,
  and `php artisan route:list --path=auth` / direct curl against `artisan serve` both
  worked. So the problem was specifically that Apache (port 80, what the browser was
  actually hitting) wasn't routing into this Laravel app at all yet.

**Fix:** Added a `VirtualHost` block to
`C:/xampp/apache/conf/extra/httpd-vhosts.conf`:

```apache
<VirtualHost *:80>
    ServerName localhost
    DocumentRoot "C:/xampp/htdocs/fpms-main/public"
    <Directory "C:/xampp/htdocs/fpms-main/public">
        AllowOverride All
        Require all granted
    </Directory>
    ErrorLog "logs/fpms-main-error.log"
    CustomLog "logs/fpms-main-access.log" common
</VirtualHost>
```

Chose `ServerName localhost` (over a separate hostname like `fpms.test`) to avoid needing
an admin-elevated edit to `C:\Windows\System32\drivers\etc\hosts`. Trade-off: this
repurposes `http://localhost` for this project on this machine — the XAMPP dashboard and
any other htdocs project relying on plain `localhost` would need its own vhost/hostname
going forward.

Validated config with `httpd.exe -t` (`Syntax OK`) before applying, then restarted Apache
via the XAMPP Control Panel (Stop → Start) rather than killing the process from a
terminal, since Apache was running as a foreground process tracked by the Control Panel
GUI, not a Windows service.

## 5. Admin user was missing again after the Apache fix

**Symptom:** After the vhost fix, `POST /api/auth/login` through Apache correctly reached
Laravel (no more 404) but returned `"Invalid email or password."` for the same admin
credentials that worked earlier.

**Investigation:** `php artisan tinker --execute="...User::where('email', ...)->first()"`
returned `NULL` — the `users` table was empty again, while `Division::count()` still
returned `6`. This points to something (most likely a `migrate:fresh` or similar) having
reset the `users` table without a full reseed in between the two test points, while
`.env`/DB connection config (`DB_DATABASE=fpms`) was confirmed unchanged.

**Fix:** Recreated the admin user with the same tinker command as step 3, then
re-verified via curl through the new Apache vhost — returned a valid token and
`role: "ADMIN"`. Logging in through the actual browser UI subsequently redirected to
`/users` (per the `ADMIN` role redirect in `AuthContext.jsx`) and succeeded.

## Outcome

- `npm run build` succeeds.
- `http://localhost` is served by Apache directly from `fpms-main/public` via the new
  vhost.
- `admin@example.com` / `password123` logs in successfully and lands on User Management.
- New users going forward should be created by an admin through that page, not via
  tinker — the tinker route was only needed to bootstrap the very first account.

## 6. Dockerfile drafted for deployment

Reviewed a hand-written `Dockerfile` (PHP-FPM + nginx on Alpine) against the actual
project (`composer.json`, `.env`) to correct mismatches before it was ever built:

- **Wrong DB driver:** it installed `postgresql-dev`/`pdo_pgsql`, but `.env` has
  `DB_CONNECTION=mysql`. Swapped for `pdo_mysql` — no extra system package needed for
  that one, since MySQL client support (mysqlnd) is already built into the official PHP
  image, unlike Postgres which needs headers at compile time.
- **Missing `zip` extension:** `phpoffice/phpspreadsheet` and `phpoffice/phpword` (both
  in `composer.json`) read/write xlsx/docx, which are zip-based formats — without
  `ext-zip` those would fail at runtime. Added `libzip-dev` (system) and
  `docker-php-ext-install zip`.
- Left `gd`, `mbstring`, `exif`, `pcntl`, `bcmath`, `pdo`, `libpng-dev`,
  `oniguruma-dev`, `libxml2-dev`, and the nginx/node/composer setup as-is — checked
  against actual usage and all still needed.

The Dockerfile also `COPY`s `docker/nginx.conf` and `docker/start.sh`, neither of which
existed yet, and there was no `.dockerignore` — meaning `COPY . .` would have baked the
real local `.env` (live `APP_KEY`, DB credentials) straight into the image. Created all
three:

- **`.dockerignore`** — excludes `.env`/`.env.*` (except `.env.example`), `.git`,
  `node_modules`, `vendor`, transient `storage/` contents, and test/editor files from
  the build context.
- **`docker/nginx.conf`** — a full `nginx.conf` (the Dockerfile replaces
  `/etc/nginx/nginx.conf` wholesale, not a `conf.d` snippet), listening on `10000` to
  match the Dockerfile's `EXPOSE`, serving `public/` as document root, and proxying
  `.php` requests to php-fpm on `127.0.0.1:9000` (php-fpm's default pool address,
  unchanged).
- **`docker/start.sh`** — deliberately does `config:cache`/`route:cache`/`view:cache`
  and `migrate --force` at container **start**, not at image build time, since real
  env vars (`APP_KEY`, `DB_*`, etc.) typically only exist at runtime on hosting
  platforms, not during the build step. Then starts `php-fpm -D` (backgrounded) and
  `nginx -g "daemon off;"` (foreground, keeps the container alive).

**Known trade-off:** `start.sh` runs `php artisan migrate --force` on every container
start. Fine for a single instance; if this is ever scaled to multiple replicas,
simultaneous migrations from each container could race — would need to move to a
separate release/init step at that point.

## Known follow-ups / things to watch

- If this repo is later deployed to a case-sensitive (e.g. Linux) server, double-check
  there isn't a stray duplicate `App.jsx`/`app.jsx` pair expected there — this Windows
  checkout only has one physical entry file (`app.jsx`) plus the separately-named
  `AppRoot.jsx`.
- If the `users` table ever gets wiped again (e.g. by `migrate:fresh`), the admin account
  needs to be recreated via the tinker command in step 3 — there is no automatic
  first-admin seeder.
- The Apache vhost now claims `localhost` for this project; remember that if you need to
  serve another project from XAMPP on this machine.
