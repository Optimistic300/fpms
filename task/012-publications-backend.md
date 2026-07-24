# Task 012: Publications Backend

**Status:** Done
**Depends on:** 003, 004
**Docs referenced:** `docs/03-api-reference.md` (Publications section), `docs/02-data-model.md` (Publication)

## Objective

Implement all backend endpoints for Publications: list with filters, pipeline counts, create, and update. Publications track scholarly output (papers, theses, reports, CCST student work) through Draft → Submitted → In Revision → Published stages.

## Context

Researchers and Students track their publications through their lifecycle. The Publications screen shows a pipeline view with stage counts and individual publication cards. Management sees publications institute-wide on the Executive Dashboard. Publications can optionally be linked to a project.

## Scope

**In scope:**
- `GET /api/publications` — list publications with filters (submittedBy, status, type), pagination
- `GET /api/publications/pipeline` — counts by status
- `POST /api/publications` — create publication
- `PUT /api/publications/:id` — update publication (status, metadata, manuscript file)
- `PublicationPolicy` — authorization rules
- `PublicationResource` — includes linked project info
- Action classes: `CreatePublicationAction`, `UpdatePublicationAction`

**Out of scope:**
- Publications frontend (Task 022)
- Publication deadline alerts (Task 026 — GenerateDeadlineAlerts command)

## Relevant data model

### Publication
| Field | Type | Notes |
|-------|------|-------|
| id | bigint, auto | PK |
| title | varchar(500) | |
| authors | text | Comma-separated or JSON array |
| type | enum | PAPER, THESIS, REPORT, STUDENT |
| status | enum | DRAFT, SUBMITTED, IN_REVISION, PUBLISHED |
| journalName | varchar(255), nullable | |
| linkedProjectId | bigint, nullable | FK to projects |
| doi | varchar(255), nullable | Required if PUBLISHED |
| manuscriptFilePath | varchar(500), nullable | |
| submittedById | bigint | FK |
| studentName | varchar(255), nullable | If STUDENT type |
| supervisor | varchar(255), nullable | If STUDENT type |
| degreeProgramme | varchar(255), nullable | If STUDENT type |
| submissionDate | date, nullable | |
| revisionDueDate | date, nullable | For IN_REVISION |
| timestamps | | |

## Relevant API contract

### `GET /api/publications`
**Auth:** Required, **Roles:** All
**Query Params:** `submittedBy`, `status`, `type`, `page`, `limit`
**Response 200:** Paginated array of publication objects with linked project info

### `GET /api/publications/pipeline`
**Auth:** Required, **Roles:** All
**Response 200:** `{ data: { draft: N, submitted: N, inRevision: N, published: N } }`

### `POST /api/publications`
**Auth:** Required, **Roles:** RESEARCHER, STUDENT, DIVISION_HEAD
**Request:** `{ title, authors, type, status, journalName?, linkedProjectId?, doi?, manuscriptFile? (base64), studentName?, supervisor?, degreeProgramme?, submissionDate?, revisionDueDate? }`
**Response 201:** Publication object

### `PUT /api/publications/:id`
**Auth:** Required, **Roles:** Owner of the publication
**Request:** Any subset of fields above
**Response 200:** Updated publication object

## Architectural conventions that apply

- `PublicationPolicy` methods: `viewAny` (all), `create` (RESEARCHER, STUDENT, DIVISION_HEAD), `update` (owner), `view` (all)
- Owner is determined by `submittedById === auth()->id()`
- Type STUDENT has additional fields: `studentName`, `supervisor`, `degreeProgramme`
- DOI validation: if status is PUBLISHED, DOI is required. On status change to PUBLISHED, validate DOI is present.
- Manuscript file stored via `FileStorageInterface` (local disk for dev)
- Base64 manuscript file decoded and stored on create/update
- Pagination uses the standard envelope

## Step-by-step implementation checklist

- [ ] Create `app/Policies/PublicationPolicy.php` with methods: `viewAny`, `create`, `update`, `view`
- [ ] Register `PublicationPolicy` in `AuthServiceProvider`
- [ ] Create `app/Http/Resources/PublicationResource.php` — includes linkedProject `{ id, title }` if linked
- [ ] Create `app/Http/Requests/StorePublicationRequest.php` — validates title, authors, type, status; conditional doi if PUBLISHED; conditional student fields if STUDENT type
- [ ] Create `app/Http/Requests/UpdatePublicationRequest.php` — same fields all optional
- [ ] Create `app/Actions/Publication/CreatePublicationAction.php`:
  - Set `submittedById = auth()->id()`
  - Decode and store manuscript file if present
  - Create publication record
  - Return publication
- [ ] Create `app/Actions/Publication/UpdatePublicationAction.php`:
  - Update only provided fields
  - If manuscript file provided, delete old file, store new one
  - If status changing to PUBLISHED, validate DOI is set
  - Return publication
- [ ] Create `app/Http/Controllers/Api/PublicationController.php` with methods: `index`, `pipeline`, `store`, `update`
- [ ] Implement `pipeline()`: query counts grouped by status, return as single object
- [ ] Register routes in `routes/api.php`:
  - `GET /publications`, `POST /publications`
  - `GET /publications/pipeline`
  - `PUT /publications/{id}`
- [ ] Write tests: create publication, list with filters, pipeline counts, update status, update with DOI validation, authorization (only owner can update)

## Definition of done

- `GET /api/publications` returns paginated publication list with filters
- `GET /api/publications/pipeline` returns counts by status
- `POST /api/publications` creates publication (with optional manuscript file)
- `PUT /api/publications/:id` updates publication fields
- Setting status to PUBLISHED without DOI returns 422 validation error
- STUDENT type publications track student-specific fields
- Only owner can update publication
- All responses use camelCase keys
- PHPUnit tests pass

## Open questions / assumptions inherited

None.
