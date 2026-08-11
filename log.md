# FPMS Debug Log

Numbered record of problems found and fixed during local setup and Render deployment.

---

## Debug 1 — Vite build failing: missing `resources/js/app.jsx`

**Problem identified:** `vite.config.js` and `welcome.blade.php` both referenced `resources/js/app.jsx` (lowercase), but only `App.jsx` (capital) existed. That file wasn't even a root component — it was entry-point code that did `import App from './App'`, a self-import (the base name `App` resolves to itself regardless of case). Deeper cause: this Windows/NTFS directory has case-sensitivity disabled (confirmed via `fsutil`), so `App.jsx`/`app.jsx` were literally one file, not two. There was also no actual router component anywhere in the codebase, despite `AppShell`, `ProtectedRoute`/`PublicRoute`, `AuthContext`, and 20 pages all expecting one.

**Solution:** Renamed the single physical file to lowercase `app.jsx` and kept it as the thin entry point. Created a new file `AppRoot.jsx` (distinct name, avoids the case-collision) containing the actual `BrowserRouter`/`Routes` tree wiring together every page.

**Code changed:**

`resources/js/app.jsx` — from:
```jsx
import App from './App';
...
root.render(<App />);
```
to:
```jsx
import App from './AppRoot';
...
root.render(<App />);
```

`resources/js/AppRoot.jsx` — new file, ~80 lines: `BrowserRouter` + `AuthProvider`, `/login` behind `PublicRoute`, all other routes behind `ProtectedRoute` + `AppShell`, one `<Route>` per page.

---

## Debug 2 — Browser login returned 404 even though the API worked via curl

**Problem identified:** `resources/js/api/axios.js` uses `baseURL: '/api'` (root-relative). XAMPP's Apache `DocumentRoot` was still the default `C:/xampp/htdocs`, not `fpms-main/public`, and there was no vhost — so `http://localhost` wasn't routed into the Laravel app at all yet. `php artisan serve` + curl worked because it bypassed Apache entirely.

**Solution:** Added a `VirtualHost` block for `localhost` pointing at `fpms-main/public`.

**Code changed:**

`C:/xampp/apache/conf/extra/httpd-vhosts.conf` — added:
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

---

## Debug 3 — No admin account existed (and no way to create one via the UI)

**Problem identified:** `DatabaseSeeder.php` only seeded `Divisions`/`ActivityTypes`, never a `User`. There is also no sign-up route by design (confirmed no `Register`/`Signup` page and no `register` route in `routes/auth.php`) — new accounts are meant to be admin-provisioned. Result: fresh DB had zero users and no way to create one.

**Solution:** Created the first admin manually via `php artisan tinker`, passing the password as plain text (the `User` model casts `password` as `'hashed'` and auto-hashes on save).

**Code changed:** none (one-off data operation):
```bash
php artisan tinker --execute="\App\Models\User::create(['full_name'=>'Admin User','email'=>'admin@example.com','password'=>'password123','role'=>'ADMIN','division_id'=>\App\Models\Division::first()->id,'is_active'=>true,'avatar_initials'=>'AU']);"
```

---

## Debug 4 — Dockerfile had the wrong DB driver and a missing PHP extension

**Problem identified:** A hand-written Dockerfile installed `postgresql-dev`/`pdo_pgsql`, but `.env` had `DB_CONNECTION=mysql`. It also lacked `ext-zip`, which `phpoffice/phpspreadsheet` and `phpoffice/phpword` (both in `composer.json`) require to read/write xlsx/docx (zip-based formats).

**Solution:** Swapped the DB driver to MySQL and added the zip extension. (Later, in Debug 6, this was hand-reverted back to Postgres once Render + Neon was chosen as the actual deploy target.)

**Code changed:**

`Dockerfile` — from:
```dockerfile
RUN apk add --no-cache ... postgresql-dev
RUN docker-php-ext-install pdo pdo_pgsql mbstring exif pcntl bcmath gd
```
to:
```dockerfile
RUN apk add --no-cache ... libzip-dev
RUN docker-php-ext-install pdo pdo_mysql mbstring exif pcntl bcmath gd zip
```

Also created (didn't exist yet): `.dockerignore`, `docker/nginx.conf`, `docker/start.sh`.

---

## Debug 5 — Admin account disappeared again after the Apache fix

**Problem identified:** `php artisan tinker` lookup for the admin email returned `NULL` while `Division::count()` still returned `6` — the `users` table had been wiped (most likely by a `migrate:fresh`) without a reseed in between.

**Solution:** Recreated the admin user with the same tinker command as Debug 3, then re-verified via curl through the Apache vhost.

**Code changed:** none (data operation, repeat of Debug 3).

---

## Debug 6 — Render deploy: storage permission denied + missing `sessions` table

**Problem identified:** Live URL returned a Laravel `UnexpectedValueException` — `storage/logs/laravel.log` permission denied on every log write, and `SQLSTATE[42P01]: relation "sessions" does not exist` against Neon Postgres. `start.sh` had no `set -e` and no error checking, so a failed `migrate --force` silently fell through to starting php-fpm/nginx anyway instead of failing the deploy.

**Solution:** Added `set -e` to `start.sh` so any failed boot step now aborts instead of masking the failure.

**Code changed:**

`docker/start.sh` — from:
```sh
#!/bin/sh

# Fix permissions
...
```
to:
```sh
#!/bin/sh
set -e

# Fix permissions
...
```

---

## Debug 7 — `SQLSTATE[42P07]: Duplicate table "users" already exists`

**Problem identified:** After the `set -e` fix, the next deploy's migrations failed with a duplicate table error. Root cause: an earlier deploy attempt had created some tables before crashing (on the Debug 6 permission failure) but died before Laravel could record that batch in its `migrations` tracking table — so the next run started from migration #1 and collided with tables that already existed.

**Solution:** Since no request had ever successfully used the database yet, dropped and recreated the Neon schema from scratch rather than hand-reconciling partial migration state.

**Code changed:** none (database operation, via Neon SQL console):
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

---

## Debug 8 — Page loaded (HTTP 200) but rendered blank

**Problem identified:** Fetched the deployed HTML directly and found the built JS/CSS linked as `http://fpms-1.onrender.com/build/assets/...` while the page itself was served over `https://` — browsers block that as mixed content, so the script never loaded and React never mounted. Render terminates TLS at its edge and forwards requests over plain HTTP, and nothing in the app trusted/used the `x-forwarded-proto` header, so Laravel's URL generation defaulted to `http`.

**Solution:** Force the URL scheme to `https` in production, sidestepping proxy-trust configuration entirely.

**Code changed:**

`app/Providers/AppServiceProvider.php` — from:
```php
public function boot(): void
{
    RateLimiter::for('login', function (Request $request) {
        return Limit::perMinute(5)->by($request->ip());
    });
}
```
to:
```php
public function boot(): void
{
    if ($this->app->environment('production')) {
        URL::forceScheme('https');
    }

    RateLimiter::for('login', function (Request $request) {
        return Limit::perMinute(5)->by($request->ip());
    });
}
```

---

## Debug 9 — Login on Render always returned 422 "Invalid email or password"

**Problem identified:** Render's free tier has no Shell/SSH access, so the local tinker approach (Debug 3/5) wasn't available in production. After adding an admin-creation seeder, login *still* 422'd — because `start.sh` only ever called that seeder, never the base `DatabaseSeeder`, so the `divisions` table was empty on Neon and the admin seeder's `Division::first()` guard silently no-op'd every time. Before wiring in a `db:seed` call to fix that, `DivisionSeeder`/`ActivityTypeSeeder` also needed to be made idempotent first, since Render's free tier respins the container (re-running `start.sh`) on every cold start after idling — a non-idempotent seed would have piled up duplicates.

**Solution:** Added `AdminUserSeeder` (env-var driven, guarded against duplicates). Converted `DivisionSeeder`/`ActivityTypeSeeder` from `::create()` to `::firstOrCreate()`. Wired a full `db:seed --force` into `start.sh` ahead of the admin seeder call.

**Code changed:**

`database/seeders/AdminUserSeeder.php` — new file:
```php
class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('ADMIN_EMAIL');
        $password = env('ADMIN_PASSWORD');
        if (! $email || ! $password) return;
        if (User::where('email', $email)->exists()) return;
        $division = Division::first();
        if (! $division) return;

        User::create([
            'full_name' => env('ADMIN_NAME', 'Admin'),
            'email' => $email,
            'password' => $password,
            'role' => 'ADMIN',
            'division_id' => $division->id,
            'is_active' => true,
            'avatar_initials' => 'AD',
        ]);
    }
}
```

`database/seeders/DivisionSeeder.php` / `ActivityTypeSeeder.php` — from:
```php
Division::create(['name' => $name]);
// and
ActivityType::create($type);
```
to:
```php
Division::firstOrCreate(['name' => $name]);
// and
ActivityType::firstOrCreate(['slug' => $type['slug']], $type);
```

`docker/start.sh` — added, after `migrate --force`:
```sh
php artisan db:seed --force
php artisan db:seed --class=Database\\Seeders\\AdminUserSeeder --force
```

---

## Debug 10 — "New Project" link led to a dead-end placeholder

**Problem identified:** The Dashboard's "Create your first project" link (`to="/projects/new"`) rendered `NewProject.jsx`, which was just `export { default } from './Placeholder'` — a "Coming soon" screen. Meanwhile the Projects page had a fully built creation form (`NewProjectModal.jsx`), but it was only reachable via its own local-state-toggled button, not via the `/projects/new` route. Two different entry points to "new project" behaved inconsistently.

**Solution:** Made `/projects/new` render `ProjectDirectory` (same as `/projects`) and derived the modal's open state from the URL instead of local component state, so both entry points converge on the same real form.

**Code changed:**

`resources/js/AppRoot.jsx` — from:
```jsx
<Route path="projects/new" element={<NewProject />} />
```
to:
```jsx
<Route path="projects/new" element={<ProjectDirectory />} />
```

`resources/js/pages/ProjectDirectory.jsx` — from:
```jsx
const [showNewModal, setShowNewModal] = useState(false);
...
onClick={() => setShowNewModal(true)}
...
onClose={() => setShowNewModal(false)}
```
to:
```jsx
const location = useLocation();
const showNewModal = location.pathname === '/projects/new';
...
onClick={() => navigate('/projects/new')}
...
onClose={() => navigate('/projects')}
```

---

## Debug 11 — Real division list couldn't just replace the placeholder data

**Problem identified:** `DivisionSeeder.php` had 6 fictional placeholder divisions. Simply editing the seeder's array wouldn't update existing databases (`firstOrCreate` only adds, never removes), and blindly deleting the old rows would cascade-delete anything still pointing at them — including the seeded admin account — since `users.division_id`/`projects.division_id` both `cascadeOnDelete()`.

**Solution:** Updated the seeder's division list to the real 11 CSIR-FORIG divisions, then added a one-time, idempotent cleanup seeder that reassigns anything on an old division to `Administration` before deleting the legacy rows.

**Code changed:**

`database/seeders/DivisionSeeder.php` — from:
```php
$divisions = [
    'Forest Ecology', 'Climate Change', 'Social Science',
    'Forest Products and Utilisation', 'Forest Genetics and Tree Improvement',
    'Plant Health and Quarantine',
];
```
to:
```php
$divisions = [
    'Biodiversity Conservation and Ecosystem Services',
    'Forest Improvement and Productivity',
    'Forest and Climate Change',
    'Forest Economics and Marketing Division',
    'Forest Policy, Governance and Livelihoods',
    'Wood Industry and Utilisation',
    'Commercialisation', 'Administration', 'Finance',
    'Information and Communication Section',
    'Grants and Projects Office',
];
```

`database/seeders/CleanupLegacyDivisionsSeeder.php` — new file:
```php
class CleanupLegacyDivisionsSeeder extends Seeder
{
    private const LEGACY_NAMES = ['Forest Ecology', 'Climate Change', /* ...6 total */];
    private const FALLBACK_NAME = 'Administration';

    public function run(): void
    {
        $legacyDivisions = Division::whereIn('name', self::LEGACY_NAMES)->get();
        if ($legacyDivisions->isEmpty()) return;

        $fallback = Division::where('name', self::FALLBACK_NAME)->first();
        if (! $fallback) return;

        $legacyIds = $legacyDivisions->pluck('id');
        User::whereIn('division_id', $legacyIds)->update(['division_id' => $fallback->id]);
        Project::whereIn('division_id', $legacyIds)->update(['division_id' => $fallback->id]);
        Division::whereIn('id', $legacyIds)->delete();
    }
}
```

`docker/start.sh` — added, after the base `db:seed --force`:
```sh
php artisan db:seed --class=Database\\Seeders\\CleanupLegacyDivisionsSeeder --force
```

---

## Debug 12 — Division dropdown empty on the new-project form

**Problem identified:** `NewProjectModal`'s options were fetched from `GET /divisions/summary`, gated by `InstitutePolicy::view()` → `$user->isManagement()` — i.e. only the `MANAGEMENT` role could call it. Every other role, including `ADMIN` and the researchers/students who'd actually create projects, got a `403`, silently swallowed by a `.catch(() => {})`, leaving the dropdown permanently empty regardless of what was in the `divisions` table. Neither existing endpoint fit as a general-purpose list: `/divisions/summary` is MANAGEMENT-only, `/admin/divisions` is ADMIN-only (`authorize('viewAny', User::class)`).

**Solution:** Added a new `GET /divisions` endpoint with no role gate (just requires being authenticated), and pointed the frontend at it.

**Code changed:**

`app/Http/Controllers/DivisionController.php` — added:
```php
public function index(): JsonResponse
{
    return response()->json([
        'data' => DivisionResource::collection(Division::orderBy('name')->get()),
    ]);
}
```

`routes/divisions.php` — added:
```php
Route::get('/divisions', [DivisionController::class, 'index']);
```

`resources/js/pages/ProjectDirectory.jsx` — from:
```jsx
apiClient.get('/divisions/summary').then((res) => {
    setDivisions(res.data.data.map((d) => ({ id: d.divisionId, name: d.divisionName })));
});
```
to:
```jsx
apiClient.get('/divisions').then((res) => {
    setDivisions(res.data.data.map((d) => ({ id: d.id, name: d.name })));
});
```

---

## Known issue — identified, not yet fixed

**AI Assistant feature is broken on Render/Postgres.** `AiAssistantService.php` runs raw MySQL-only syntax (`MATCH(...) AGAINST(...) IN BOOLEAN MODE`), which doesn't exist in Postgres. Every `/ai/query` call throws a SQL error in production, which `AiController.php` catches and reports as a misleading generic "The assistant took too long to respond" (408) instead of the real cause. Also worth knowing: it isn't a generative AI/LLM integration at all — no API key, no HTTP call to any model provider — it's a full-text document search with a template-based response formatter. Not yet fixed; would need a Postgres-compatible (or driver-aware) rewrite of the search query.
