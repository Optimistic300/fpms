# Task 009: Activities Backend

**Status:** Done
**Depends on:** 003, 004
**Docs referenced:** `docs/03-api-reference.md` (Activities section), `docs/02-data-model.md` (Activity, ActivityType), `docs/04b-backend-architecture.md`

## Objective

Implement all backend endpoints for Activities and Activity Types: list, create, update, delete activities with optional document attachments; CSV export; activity type listing. Activities are logged pieces of work attached to a project.

## Context

Researchers, Students, and Division Heads log field or lab activities against their projects. Activities have a date, type (from a configurable list), description, notes, and optional document attachments. The "My Activities" screen shows a user's full activity history with inline document actions.

## Scope

**In scope:**
- `GET /api/activity-types` — list all activity types
- `GET /api/activities` — list activities with filters (projectId, owner, type, period, researcher), pagination, CSV export
- `POST /api/activities` — create activity
- `POST /api/activities/:id/documents` — upload document to activity (multipart)
- `PUT /api/activities/:id` — update activity
- `DELETE /api/activities/:id` — delete activity and attached documents
- `ActivityPolicy` — authorization rules
- `ActivityResource` — includes document list
- Action classes: `LogActivityAction`, `UpdateActivityAction`, `DeleteActivityAction`

**Out of scope:**
- Document download/preview/publish/delete standalone endpoints (Task 010)
- Forward documents from activity (Task 007)
- The Log Activity multi-step frontend (Task 016)
- The My Activities frontend (Task 016)

## Relevant data model

### Activity
| Field | Type | Notes |
|-------|------|-------|
| id | bigint, auto | PK |
| projectId | bigint | FK to projects |
| userId | bigint | FK to users (who logged it) |
| date | date | Defaults to today |
| type | varchar(100) | From activity_types table |
| description | text | |
| notes | text, nullable | |
| timestamps | | |

### ActivityType
| Field | Type | Notes |
|-------|------|-------|
| id | bigint, auto | PK |
| name | varchar(100) | Display name |
| slug | varchar(100) | Machine identifier |

### Document (attached to activity)
| Field | Type | Notes |
|-------|------|-------|
| id | bigint, auto | PK |
| projectId | bigint | FK |
| activityId | bigint, nullable | FK |
| uploadedBy | bigint | FK |
| filename | varchar(255) | |
| filePath | varchar(500) | Storage path |
| mimeType | varchar(100) | |
| size | int | Bytes |
| type | enum | DATA_SHEET, PHOTO, MAP, RECEIPT, REPORT, MANUSCRIPT, OTHER |
| published | boolean | Default false |
| timestamps | | |

## Relevant API contract

### `GET /api/activity-types`
**Auth:** Required, **Roles:** All
**Response 200:** `{ data: [{ id, name, slug }] }`

### `GET /api/activities`
**Auth:** Required, **Roles:** All (scoped by project access)
**Query Params:** `projectId`, `owner=me`, `type`, `period=this-month`, `researcher`, `page`, `limit`, `format=csv`
**Response 200:** Paginated array of `{ id, projectId, projectTitle, date, type, description, notes, documentCount, documents: [{ id, filename, type, published }] }`

### `POST /api/activities`
**Auth:** Required, **Roles:** Owner or member with project access
**Request:** `{ projectId, date, type, description, notes? }`
**Response 201:** `{ data: { id, activityId }, message: "Activity created. You can now upload files." }`

### `POST /api/activities/:id/documents`
**Auth:** Required, **Roles:** Activity owner
**Request:** `multipart/form-data` with `file` and `type` (document type enum)
**Response 201:** `{ data: { id, filename, size }, message: "File uploaded." }`

### `PUT /api/activities/:id`
**Auth:** Required, **Roles:** Activity owner
**Request:** Same fields as POST (all optional)
**Response 200:** Activity object

### `DELETE /api/activities/:id`
**Auth:** Required, **Roles:** Activity owner
**Response 200:** `{ message: "Activity and N attached documents deleted." }`

## Architectural conventions that apply

- `ActivityPolicy` methods: `viewAny` (scoped by project access), `create` (must have project access), `update` (activity owner), `delete` (activity owner)
- Activity `userId` is always set to `auth()->id()` on creation
- Document upload in `POST /api/activities/:id/documents` uses `FileStorageInterface` for file storage (Task 010 will provide the full implementation — for now, store on local disk)
- CSV export format: `GET /api/activities?format=csv` returns `text/csv` response with `Content-Disposition: attachment`
- Activity creation is wrapped in a DB transaction (create activity + optional file store)
- Fire `ActivityLogged` event after creation (listener is optional for v1 — used for future notification/feed functionality)
- Activity types are seeded by `ActivityTypeSeeder` (Task 002)

## Step-by-step implementation checklist

- [ ] Create `app/Policies/ActivityPolicy.php` with methods: `viewAny`, `create`, `update`, `delete`
- [ ] Register `ActivityPolicy` in `AuthServiceProvider`
- [ ] Create `app/Http/Resources/ActivityResource.php` — includes project title, document list with doc info
- [ ] Create `app/Http/Resources/ActivityTypeResource.php`
- [ ] Create `app/Http/Requests/StoreActivityRequest.php` — validates projectId (exists:projects), date, type, description
- [ ] Create `app/Http/Requests/UpdateActivityRequest.php`
- [ ] Create `app/Http/Requests/UploadActivityDocumentRequest.php` — validates file (max 25MB, allowed MIME types per 07-non-functional-requirements) and type
- [ ] Create `app/Actions/Activity/LogActivityAction.php`:
  - Create Activity record in DB transaction
  - Fire `ActivityLogged` event
  - Return activity
- [ ] Create `app/Actions/Activity/UpdateActivityAction.php`
- [ ] Create `app/Actions/Activity/DeleteActivityAction.php` — delete activity, delete associated documents from storage
- [ ] Create `app/Events/ActivityLogged.php` — contains the Activity model
- [ ] Create `app/Http/Controllers/Api/ActivityController.php` with methods: `index`, `store`, `update`, `destroy`, `uploadDocument`
- [ ] Create `app/Http/Controllers/Api/ActivityTypeController.php` (if not already from Task 005) with method: `index`
- [ ] Implement `index()`:
  - Start with Activity query
  - Apply filters: `projectId`, `owner=me` (userId = auth()->id()), `type`, `period`, `researcher`
  - If `format=csv`, return CSV download stream
  - Otherwise, paginate and return ActivityResource collection
- [ ] Implement CSV export: select fields (date, projectTitle, type, description, notes, documentCount), return as CSV
- [ ] Register routes in `routes/api.php`:
  - `GET /activity-types`
  - `GET /activities`, `POST /activities`
  - `POST /activities/{id}/documents`
  - `PUT /activities/{id}`, `DELETE /activities/{id}`
- [ ] Write tests for each endpoint: create activity, list with filters, CSV export, upload document, update, delete, authorization checks

## Definition of done

- `GET /api/activity-types` returns seeded activity type list
- `GET /api/activities` returns paginated activities with filters working
- `GET /api/activities?format=csv` returns CSV download
- `POST /api/activities` creates activity and returns ID
- `POST /api/activities/:id/documents` uploads file and returns file metadata
- `PUT /api/activities/:id` updates activity fields
- `DELETE /api/activities/:id` deletes activity and attached documents
- Authorization enforced: activity owner can update/delete; project access required for view/create
- All responses use camelCase keys
- PHPUnit tests pass

## Open questions / assumptions inherited

None.
