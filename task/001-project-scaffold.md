# Task 001: Project Scaffold

**Status:** Done
**Depends on:** None
**Docs referenced:** `docs/04b-backend-architecture.md`, `docs/04-frontend-architecture.md`, `AGENTS.md`

## Objective

Create a fresh Laravel application with React + Vite frontend scaffold, configure environment settings, and establish the folder structure defined in the backend architecture. This is the prerequisite for all other work.

## Context

Every other task in this build plan runs inside the project created here. The folder structure under `app/` (Actions, Services, Contracts, Repositories, Http/Controllers/Api, Http/Requests, Http/Resources, Events, Listeners, Notifications, Jobs, Policies, Models, Console/Commands) must be in place before any implementation task can write files.

## Scope

**In scope:**
- Create a new Laravel application in this repository root
- Configure `.env` for MySQL (database name `skms`, connection defaults)
- Install and configure Laravel Sanctum
- Install Laravel's default notifications (migration)
- Install React + Vite preset (Laravel Breeze API stack or manual equivalent)
- Install Axios, React Router, DOMPurify via npm
- Create the full directory structure under `app/` as specified in `04b-backend-architecture.md`
- Create `resources/js/` scaffold: entry point, root App component, router skeleton
- Configure Vite for React + HMR
- Ensure `database/migrations/` includes the default Laravel migrations (users, password_resets, personal_access_tokens, notifications, jobs, failed_jobs)

**Out of scope:**
- Any custom models, controllers, or feature code
- Any test writing beyond verifying the scaffold works
- Any CSS/frontend styling

## Relevant data model

Not applicable — this task creates no custom entities.

## Relevant API contract

Not applicable — this task implements no endpoints.

## Relevant frontend behavior

Not applicable — this task creates the frontend skeleton only.

## Architectural conventions that apply

- Folder structure under `app/` must match `docs/04b-backend-architecture.md` exactly
- Vite config must serve the React app from Laravel (no CORS proxy needed since API is same-origin)
- Sanctum must be configured for token-based (not session) authentication — SPA stateful mode is not used

## Step-by-step implementation checklist

- [ ] Run `composer create-project laravel/laravel .` in the repo root (or `composer install` if already a Laravel app)
- [ ] Configure `.env`: `DB_DATABASE=skms`, `DB_USERNAME`, `DB_PASSWORD` for local MySQL
- [ ] Configure `.env`: `SANCTUM_STATEFUL_DOMAINS=""` (token mode, no SPA domains)
- [ ] Run `php artisan install:api` or manually require `laravel/sanctum` and publish config/migration
- [ ] Run `php artisan vendor:publish --provider="Illuminate\Notifications\NotificationServiceProvider"` if needed
- [ ] Ensure `database/migrations/` contains: `create_users_table`, `create_password_resets_table`, `create_personal_access_tokens_table`, `create_notifications_table`, `create_jobs_table`, `create_failed_jobs_table`
- [ ] Install Laravel's React + Vite scaffolding: `php artisan install:api` + npm install of `react`, `react-dom`, `vite`, `@vitejs/plugin-react`, `laravel-vite-plugin`
- [ ] Run `npm install react-router-dom axios dompurify`
- [ ] Create directory structure:
  ```
  app/Actions/Report/
  app/Services/
  app/Contracts/
  app/Repositories/
  app/Http/Controllers/Api/
  app/Http/Requests/
  app/Http/Resources/
  app/Events/
  app/Listeners/
  app/Notifications/
  app/Jobs/
  app/Policies/
  app/Models/
  app/Console/Commands/
  ```
- [ ] Create `resources/js/app.jsx` entry point that mounts React
- [ ] Create `resources/js/App.jsx` with React Router skeleton
- [ ] Create `resources/js/app.css` (minimal reset)
- [ ] Update `vite.config.js` to point input at `resources/js/app.jsx`
- [ ] Update `routes/web.php` to catch-all route for SPA
- [ ] Run `php artisan migrate` (using local MySQL) to verify DB connection and default migrations work
- [ ] Run `npm run build` to verify Vite compiles without errors

## Definition of done

- `php artisan serve` starts without errors
- `npm run dev` compiles without errors
- `php artisan migrate` runs all default migrations successfully
- `php artisan route:list` shows the default Laravel routes
- The `app/` directory has all subdirectories listed above (each with a `.gitkeep` or README)
- The repository can be cloned fresh and a new developer can run the setup steps above to get the same result

## Completion Notes

**Completed:** 2026-07-05
**Commit:** `696a9e7`

**Summary:** Scaffolded Laravel 13 with React + Vite, Sanctum token-mode, full `app/` directory structure, React Router skeleton. MySQL `skms` database configured, all default migrations ran, `npm run build` passes.

**Files created:** 75 files — full Laravel scaffold with React entry point (`resources/js/app.jsx`), router (`App.jsx`), all `app/` subdirectories with `.gitkeep`, Sanctum config, notifications migration, Vite config with React plugin.

**Verification:**
- `php artisan migrate` — all migrations OK
- `npm run build` — builds successfully (720ms)
- `php artisan route:list` — 6 routes including SPA catch-all

**Assumptions:**
- Laravel 13 uses `password_reset_tokens` not `password_resets` — migration adjusted.
- `failed_jobs` table is created by the jobs migration — no separate migration needed.
- `@vitejs/plugin-react` v6 used (compatible with Vite 8 shipping with Laravel 13).
- `.env` left untracked (standard Laravel practice) — developer copies `.env.example`.

## Open questions / assumptions inherited

None for this task.
