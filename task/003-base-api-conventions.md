# Task 003: Base API Conventions Layer

**Status:** Done
**Depends on:** 002
**Docs referenced:** `docs/03-api-reference.md`, `docs/04b-backend-architecture.md`

## Objective

Build the shared infrastructure that every API endpoint depends on: camelCase response transformation, standard pagination/success/error envelopes, FormRequest base class, Policy base conventions, service container binding for contracts, and queue configuration.

## Context

Every backend task from here on will use these conventions. Building them once at the start avoids duplication and drift. The CamelCaseResource base class enforces the wire-format contract across all responses. The standard pagination and error envelopes mean every controller returns a consistent shape.

## Scope

**In scope:**
- `CamelCaseResource` base class extending `JsonResource` with recursive snake_case → camelCase key conversion
- Standard pagination envelope (data + meta with currentPage, lastPage, perPage, total)
- Standard success response envelope (data + message)
- Standard validation error response envelope (message + errors object)
- `App\Http\Resources\Traits\HasMessage` trait or base class that adds `with` and `additional` for the message field
- Base `FormRequest` class with camelCase → snake_case input key transformation
- Policy base registration convention (all policies registered via `AuthServiceProvider` gate)
- Contract interfaces in `app/Contracts/`: `FileStorageInterface`, `AiRetrievalInterface`, `ReportRepositoryInterface`
- Service container bindings in `AppServiceProvider` (default implementations: `LocalFileStorage` for `FileStorageInterface`, `MySqlFtsRetrieval` for `AiRetrievalInterface`, `ReportRepository` for `ReportRepositoryInterface`)
- Queue config: set `QUEUE_CONNECTION=database` in `.env`
- `app/helpers.php` loaded via Composer autoload files for any shared utility functions

**Out of scope:**
- Any concrete implementation of the contracts beyond default stubs
- Any endpoint logic
- Any frontend code

## Relevant data model

Not directly — this task touches no entities. It builds infrastructure consumed by all entity tasks.

## Relevant API contract

### Conventions implemented by this task:

**Base URL:** All endpoints under `/api` prefix.

**JSON key casing:** All request/response bodies use camelCase. Enforced via `CamelCaseResource` base class for responses and FormRequest input transformation for requests.

**Standard Pagination Envelope:**
```json
{
  "data": [ ... ],
  "meta": {
    "currentPage": 1,
    "lastPage": 5,
    "perPage": 20,
    "total": 97
  }
}
```
Query params: `?page=1&limit=20`. Default `limit` is 20.

**Standard Success Response Envelope:**
```json
{
  "data": { ... },
  "message": "optional success message"
}
```

**Standard Error Response Envelope:**
```json
{
  "message": "Human-readable error description",
  "errors": {
    "fieldName": ["Validation error 1", "Validation error 2"]
  }
}
```

**HTTP Status Codes:**
| Code | Usage |
|------|-------|
| 200 | Successful GET, PUT, PATCH, DELETE |
| 201 | Successful POST |
| 204 | Successful DELETE (no content) |
| 400 | Bad request |
| 401 | Missing or expired token |
| 403 | Authenticated but not authorised |
| 404 | Resource not found |
| 422 | Validation error |
| 429 | Rate limited |
| 500 | Server error |

## Relevant frontend behavior

Not applicable.

## Architectural conventions that apply

- All API Resources extend `CamelCaseResource` — never manually rename fields per-resource
- All Form Requests extend the base FormRequest and call `$this->camelToSnake()` in `passedValidation()` or override `validationData()`
- All controllers call `$this->authorize()` using Policy classes — never inline role checks
- Contracts in `app/Contracts/` are bound to implementations in `AppServiceProvider` via `$this->app->bind()`
- Queue connection is `database` for v1 (no Redis required)

## Step-by-step implementation checklist

- [ ] Create `AppServiceProvider` bindings for all three contracts (stub implementations that throw or return empty):
  - `FileStorageInterface` → `App\Services\FileStorageService` (stub)
  - `AiRetrievalInterface` → `App\Services\AiAssistantService` (stub)
  - `ReportRepositoryInterface` → `App\Repositories\ReportRepository`
- [ ] Create `app/Contracts/FileStorageInterface.php` with methods: `store`, `get`, `delete`, `url`
- [ ] Create `app/Contracts/AiRetrievalInterface.php` with methods: `query(string $query, array $conversationHistory): AiQueryResult`
- [ ] Create `app/Contracts/ReportRepositoryInterface.php` with methods: `findPendingQueue`, `findOverdue`, `statsForSecretary`
- [ ] Create `app/Contracts/AiQueryResult.php` readonly DTO with: `canAnswer`, `answer`, `citations`, `followUpPrompts`
- [ ] Create `app/Http/Resources/CamelCaseResource.php` — base class that overrides `toArray()` to recursively convert keys via `Str::camel()`
- [ ] Create `app/Http/Resources/Traits/HasMessage.php` — trait that adds message to response
- [ ] Create `app/Http/Resources/BaseResource.php` — extends CamelCaseResource with pagination envelope formatting, or create a static `::paginate()` helper
- [ ] Create a standard pagination helper method or a `PaginatedResource` class that wraps length-aware paginator into the standard envelope
- [ ] Create base `App\Http\Requests\ApiRequest` that transforms camelCase inputs to snake_case in `validationData()` or `passedValidation()`
- [ ] Create `app/Exceptions/Handler.php` overrides to ensure validation and auth exceptions return the standard envelope
- [ ] Register all Policies in `AuthServiceProvider` (stub entries for each policy class that will be created in later tasks)
- [ ] Set `QUEUE_CONNECTION=database` in `.env` and ensure `jobs` and `failed_jobs` tables exist (from scaffold)
- [ ] Create `app/helpers.php` with `pagination_meta()` helper if needed, register in `composer.json` autoload files
- [ ] Run `composer dump-autoload`
- [ ] Write a quick test to verify `CamelCaseResource` converts a nested snake_case array to camelCase correctly
- [ ] Write a quick test to verify `ApiRequest` transforms camelCase input keys to snake_case

## Definition of done

- `CamelCaseResource` can be instantiated and produces camelCase JSON from a snake_case array
- `ApiRequest` transforms incoming camelCase keys to snake_case before validation
- All three contracts are bound in the container with stub implementations
- Paginated responses return `data` + `meta` with the correct structure
- Error responses return `message` + `errors` with the correct structure
- `QUEUE_CONNECTION=database` is set
- A form request extending `ApiRequest` validates correctly with camelCase inputs
- A resource extending `CamelCaseResource` returns camelCase JSON

## Completion Notes

**Date:** 2026-07-07
**Implemented by:** Subagent (ses_0c1550533ffeJM3Fsg4bkALwOU)

Created the base API conventions layer: CamelCaseResource, BaseResource with pagination envelope, HasMessage trait, ApiRequest (camelCase→snake_case), Contracts (FileStorageInterface, AiRetrievalInterface, ReportRepositoryInterface, AiQueryResult DTO), stub service/repository implementations, container bindings in AppServiceProvider, exception renderers in bootstrap/app.php, helpers.php, and AuthServiceProvider policy registration. 12 new tests all passing.

Note: Laravel 11 uses bootstrap/app.php for exception handling instead of Handler.php — error envelope rendering done there.

## Open questions / assumptions inherited

None.
