# Task 010: Documents & File Storage Backend

**Status:** Not Started
**Depends on:** 003, 004
**Docs referenced:** `docs/03-api-reference.md` (Documents section, Library sections), `docs/02-data-model.md` (Document), `docs/04b-backend-architecture.md` (FileStorageInterface), `docs/07-non-functional-requirements.md` (File upload constraints)

## Objective

Implement the full file management system: document CRUD, upload/download/preview endpoints, publish-to-library flow, and the FileStorageInterface with a local disk implementation. Documents are attached to projects (and optionally to activities) and serve dual purpose: project-internal files and library-published documents.

## Context

Files are uploaded during activity logging, report submission, or standalone project document management. Once published (`published: true`), documents become visible in the Library browse and search. File storage abstracts local disk (dev) and S3 (production) behind `FileStorageInterface`. File type and size validation is enforced server-side.

## Scope

**In scope:**
- `FileStorageInterface` with local disk implementation (`LocalFileStorage`)
- `GET /api/documents` — list documents with filters (projectId, published)
- `PATCH /api/documents/:id` — update metadata (used to publish to library)
- `GET /api/documents/:id/download` — stream file as attachment
- `GET /api/documents/:id/preview` — return metadata + preview URL
- `DELETE /api/documents/:id` — delete document file and record
- `GET /api/library/stats` — library statistics (total, top divisions, added this quarter)
- `GET /api/library/documents` — browse published documents with filters
- `GET /api/library/search` — full-text search across published documents (MySQL LIKE-based for v1, no AI needed)
- `DocumentPolicy` — authorization rules
- `DocumentResource`
- `ProcessDocumentUpload` Job stub (queued file processing for future AI indexing — placeholder for Task 024)
- File upload validation: MIME type sniffing, size limits

**Out of scope:**
- Activity document upload (`POST /api/activities/:id/documents`) — already in Task 009
- Document forward (`POST /api/inbox/forward`) — Task 007
- AI indexing pipeline (Task 024)
- Full-text search improvements (Task 024 — this task uses basic LIKE search)

## Relevant data model

### Document
| Field | Type | Notes |
|-------|------|-------|
| id | bigint, auto | PK |
| projectId | bigint | FK |
| activityId | bigint, nullable | FK |
| uploadedBy | bigint | FK |
| filename | varchar(255) | Original |
| filePath | varchar(500) | Storage path |
| mimeType | varchar(100) | |
| size | int | Bytes |
| type | enum | DATA_SHEET, PHOTO, MAP, RECEIPT, REPORT, MANUSCRIPT, OTHER |
| published | boolean | Default false |
| timestamps | | |

## Relevant API contract

### `GET /api/documents`
**Auth:** Required, **Roles:** All (scoped by project access)
**Query Params:** `projectId`, `published`, `page`, `limit`
**Response 200:** Array of document objects

### `PATCH /api/documents/:id`
**Auth:** Required, **Roles:** Document owner or project owner
**Request:** `{ published: true }`
**Response 200:** `{ data: { id, published: true }, message: "Document published to library." }`

### `GET /api/documents/:id/download`
**Auth:** Required, **Roles:** User must have project access or document is published
**Response 200:** Binary file stream, `Content-Disposition: attachment`

### `GET /api/documents/:id/preview`
**Auth:** Required, **Roles:** Same as download
**Response 200:** `{ data: { id, filename, mimeType, previewUrl, inlinePreviewSupported } }`

### `DELETE /api/documents/:id`
**Auth:** Required, **Roles:** Document owner or project owner
**Response 200:** `{ message: "Document removed." }`

### `GET /api/library/stats`
**Auth:** Required, **Roles:** All
**Response 200:** `{ data: { totalDocuments, topDivisions: [...], addedThisQuarter: N } }`

### `GET /api/library/documents`
**Auth:** Required, **Roles:** All
**Query Params:** `division`, `documentType`, `researchArea`, `q` (client-side filter — server ignores or does basic LIKE), `page`, `limit`
**Response 200:** Paginated array of `{ id, title, type, division, researchArea, uploadedBy, uploadedAt }`

### `GET /api/library/search`
**Auth:** Required, **Roles:** All
**Query Params:** `q` (required)
**Response 200:** `{ data: [{ id, title, type, snippet, division, author, date, documentType }], meta: { total: N } }`
Note: `snippet` contains `<mark>` tags around search terms. Backend strips all HTML except `<mark>`.

### File Upload Constraints
| Context | Allowed MIME Types | Max Size |
|---------|-------------------|----------|
| Activity attachments | `application/pdf`, `image/*`, `application/vnd.openxmlformats-officedocument.*`, `application/vnd.ms-*`, `text/csv`, `application/zip` | 25 MB |
| Report files (PDF) | `application/pdf` | 50 MB |
| Publication manuscripts | `application/pdf`, `application/vnd.openxmlformats-officedocument.*` | 50 MB |

## Architectural conventions that apply

- `FileStorageInterface` methods: `store(UploadedFile $file, string $path): string`, `get(string $path): StreamedResponse`, `delete(string $path): bool`, `url(string $path): string`
- `LocalFileStorage` stores files in `storage/app/documents/` during development
- `DocumentPolicy` methods: `view` (has project access or published), `update` (document owner or project owner), `delete` (document owner or project owner)
- Publish flow: `PATCH /api/documents/:id { published: true }` → if transitioning to `published: true`, fire `DocumentPublished` event
- Library browse: `GET /api/library/documents` only returns documents where `published = true`
- Library search: `GET /api/library/search` searches `documents.filename` and `documents` metadata using MySQL `LIKE` or `MATCH AGAINST` (FULLTEXT index exists from Task 002). For v1, use basic `LIKE '%query%'` matched against filename, project title (join), and division name (join). Returns a `snippet` field with `<mark>` tags around matched terms. Strip all other HTML.
- Preview for PDFs returns a URL to `storage/app/documents/` that Laravel serves via `Storage::url()`
- Preview for DOCX/XLSX returns `inlinePreviewSupported: false` with a message to download
- Download uses `Storage::download()` or a streamed response

## Step-by-step implementation checklist

- [ ] Create `app/Services/FileStorageService.php` implementing `FileStorageInterface`:
  - `store(UploadedFile $file, string $path)`: store in `storage/app/documents/`, return relative path
  - `get(string $path)`: return `Storage::download()` or `Storage::response()`
  - `delete(string $path)`: `Storage::delete($path)`
  - `url(string $path)`: `Storage::url($path)`
- [ ] Bind `FileStorageInterface` to `FileStorageService` in `AppServiceProvider` (already bound to stub in Task 003 — update binding)
- [ ] Create `app/Policies/DocumentPolicy.php` with methods: `view`, `update`, `delete`
- [ ] Register `DocumentPolicy` in `AuthServiceProvider`
- [ ] Create `app/Http/Resources/DocumentResource.php`
- [ ] Create `app/Http/Requests/UpdateDocumentRequest.php` — validates `published` boolean
- [ ] Create `app/Http/Controllers/Api/DocumentController.php` with methods: `index`, `update`, `download`, `preview`, `destroy`
- [ ] Implement `download()`: resolve file via FileStorageInterface, return StreamedResponse with correct Content-Type and Content-Disposition
- [ ] Implement `preview()`: return metadata + URL, determine `inlinePreviewSupported` based on mimeType
- [ ] Implement `update()`: primarily for publish action. If `published` transitions to `true`, fire `DocumentPublished` event
- [ ] Create `app/Events/DocumentPublished.php` — contains Document model
- [ ] Create `app/Http/Controllers/Api/LibraryController.php` with methods: `stats`, `documents`, `search`
- [ ] Implement `stats()`: count published documents, top 3 divisions by count, count added this quarter
- [ ] Implement `documents()`: query `published = true`, apply division/docType/researchArea filters, paginate
- [ ] Implement `search()`: accept `q` param, query published documents with `LIKE '%query%'` on filename (joined with projects and divisions for title/division), return results with snippet
- [ ] Process snippet: find matched terms, wrap in `<mark>`, strip all other HTML tags
- [ ] Register routes in `routes/api.php`:
  - `GET /documents`, `PATCH /documents/{id}`
  - `GET /documents/{id}/download`, `GET /documents/{id}/preview`
  - `DELETE /documents/{id}`
  - `GET /library/stats`, `GET /library/documents`, `GET /library/search`
- [ ] Write tests: upload file, download file, preview, publish, delete, library browse, library search, authorization checks

## Definition of done

- `FileStorageInterface` with `LocalFileStorage` stores and retrieves files
- `GET /api/documents?projectId=N` returns documents scoped by project access
- `PATCH /api/documents/:id { published: true }` publishes document and fires event
- `GET /api/documents/:id/download` streams file with correct headers
- `GET /api/documents/:id/preview` returns metadata with preview URL
- `DELETE /api/documents/:id` removes file and record
- `GET /api/library/stats` returns total, top divisions, added this quarter
- `GET /api/library/documents` returns published documents with filters
- `GET /api/library/search?q=term` returns matches with `<mark>` snippets
- File upload validation rejects wrong MIME types and oversized files
- Authorization enforced: project access for download/preview; owner for update/delete
- All responses use camelCase keys
- PHPUnit tests pass

## Open questions / assumptions inherited

- **DOCX/XLSX preview:** v1 returns `inlinePreviewSupported: false` with download prompt. Per `09-open-questions-and-assumptions.md`, inline rendering depends on browser support.
- **Library search uses basic LIKE for v1** — FULLTEXT index exists but is not used until AI retrieval is implemented (Task 024).
