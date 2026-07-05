# FPMS — Forest Research Project Management System

## Project state

This repo contains the **documentation** for FPMS (aka SKMS — Scientific Knowledge Management System). No application code scaffolded yet. All authoritative specs live in `docs/`; `docs-source/` does not exist (source docs are also in `docs/`).

## Tech stack (from docs)

- **Backend:** Laravel (latest LTS), REST API under `/api`
- **Frontend:** React + Vite, served from inside Laravel (not a separate host)
- **Auth:** Laravel Sanctum (token mode, no sessions)
- **Database:** MySQL
- **File storage:** Local disk (dev), S3-compatible (prod)

## Key conventions (must follow — from `docs/*`)

These are not suggestions; they are hard constraints documented in the architecture:

- **JSON casing:** camelCase over the wire. Laravel API Resources transform snake_case → camelCase. All request/response keys are camelCase.
- **Side effects → Events/Listeners:** No inline notification creation in controllers or Action classes. Fire an Event, let a Listener handle the notification.
- **User-facing alerts → Notifications (database channel):** Use `Illuminate\Notifications` for bell alerts and inbox items, never ad-hoc DB writes.
- **Slow/external work → Queued Jobs:** AI indexing, file processing must be queued, never synchronous.
- **Authorisation → Policies:** No `if ($role === ...)` checks in controllers. Use Policy classes with `$this->authorize()`.
- **Periodic tasks → Scheduled Commands:** `CalculateReportOverdue`, `GenerateDeadlineAlerts` run daily via `schedule:run`.
- **SOLID throughout:** Thin controllers delegate to Action/Service classes. Swappable implementations behind Contracts (`FileStorageInterface`, `AiRetrievalInterface`).

## Documentation structure

| File | What it covers |
|------|----------------|
| `docs/00-product-overview.md` | System purpose, capabilities, non-goals |
| `docs/01-roles-and-permissions.md` | Role×capability matrix |
| `docs/02-data-model.md` | All entities, fields, enums, Mermaid ERD |
| `docs/03-api-reference.md` | Complete REST API contract (40+ endpoints) |
| `docs/04-frontend-architecture.md` | Routing, state, forms, mobile breakpoints |
| `docs/04b-backend-architecture.md` | SOLID layout, request lifecycle, worked example |
| `docs/05-screens/` | One file per wireframe (WF01–WF13) |
| `docs/06-ai-assistant.md` | "Ask SKMS" retrieval + citation model |
| `docs/07-non-functional-requirements.md` | Security, offline, backup, performance |
| `docs/08-glossary.md` | Domain terms and status values |
| `docs/09-open-questions-and-assumptions.md` | Gaps and unresolved decisions |
| `docs/10-traceability-matrix.md` | Wireframe→endpoint audit table |

Read order: `00 → 01 → 02 → 03 → 04 → 04b → (05-screens as needed)`. The API reference (`03-api-reference.md`) is the binding contract between backend and frontend.

## Open questions to resolve before coding

1. **Semantic search mechanism** — highest priority. MySQL FTS + re-ranking is the v1 assumption, but may need a vector store (Meilisearch, Typesense, Pinecone) behind `AiRetrievalInterface`.
2. **Admin screens** — no wireframes for User Management or Settings. MVP defined in `01-roles-and-permissions.md` as an assumption.
3. **Forgot password flow** — not wired, use Laravel's built-in password reset.
4. **AI model provider** — OpenAI vs. local model; TBD at pilot.

## Developer commands (once scaffolded)

```bash
# Backend
composer create-project laravel/laravel .
php artisan migrate
php artisan db:seed
php artisan serve

# Frontend (in resources/js/)
npm install && npm run dev

# Queue
php artisan queue:work

# Scheduled tasks
php artisan schedule:run

# Tests
php artisan test
```

## Roles (DB seed values)

`RESEARCHER`, `STUDENT`, `SECRETARY`, `DIVISION_HEAD`, `MANAGEMENT`, `ADMIN`

## Important filenames / entrypoints (planned)

| Path | Purpose |
|------|---------|
| `app/Actions/` | Business logic classes |
| `app/Services/` | Service classes (swappable behind Contracts) |
| `app/Contracts/` | Interfaces (`FileStorageInterface`, `AiRetrievalInterface`) |
| `app/Http/Requests/` | Form Request validation |
| `app/Http/Resources/` | API Resource response shaping |
| `app/Events/` + `app/Listeners/` | Side-effect chains |
| `app/Notifications/` | Database-channel notifications |
| `app/Jobs/` | Queued work (AI indexing, file processing) |
| `app/Policies/` | Authorisation |
| `routes/api.php` | All `/api` routes |

## Operational modes

### PLANNING MODE
Use when: no task file is specified, user asks for design decisions, or a new feature not covered by existing tasks is requested.
- Ask clarifying questions before proposing anything
- Never assume design, tech stack, or features
- Use sub-agents to research and review the plan
- Present plan to user before any implementation

### EXECUTION MODE (default when a task file exists)
Use when: a `tasks/task_NN.md` file is the current work item.
- Do NOT ask clarifying questions about things already specified in the task file or docs
- The task file is the source of truth — execute it exactly
- Use sub-agents for implementation (see Sub-Agent Rules below)
- Act as coordinator: delegate, verify output, integrate

### EDIT / CHANGE MODE
Use when: user requests a change to already-implemented code.
- Identify what can be changed in parallel
- Use sub-agents to implement changes
- Verify each sub-agent output against docs and task acceptance criteria
- Never make changes that contradict `docs/architecture.md` or `docs/data-models.md` without explicit user approval

## Task Execution Workflow

1. Read `tasks/task_NN.md` fully before doing anything
2. Identify which `docs/` files are referenced — load only those
3. Delegate implementation to sub-agents
4. After implementation, run the full verification sequence:
   - `php artisan test` (backend tests pass)
   - `npm run lint && npm run typecheck` (frontend quality gates)
   - `php artisan migrate:fresh --seed` (database round-trip)
   - If docs were changed: verify against `docs/03-api-reference.md` and `docs/02-data-model.md`
