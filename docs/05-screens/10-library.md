# WF10 — Library

## Purpose
Permanent institutional knowledge base. Browse, search, preview, download, and forward published documents.

## Entry Points
- Sidebar "Library" link
- "Browse the library" button from AI assistant empty state

## Data Fetched on Mount
- `GET /api/library/stats` → total count, per-division counts, added this quarter
- `GET /api/library/documents?page=1&limit=20` → initial browse list

## Layout

### Four Stat Cards (informational)
Total documents, top three contributing divisions by count.

### Full-Text Search Panel
- Search input + Search button + Clear button
- On submit: `GET /api/library/search?q=:query`
- Response includes `snippet` with `<mark>` tags around search terms
- Backend strips all HTML except `<mark>` from snippet
- Frontend sanitises with DOMPurify before `dangerouslySetInnerHTML`
- **Warning banner** (always visible when results show): "This is full-text search, not AI. For a synthesised answer use the Ask SKMS button." — never dismissible.

### Search Result Card
Type chip, document title, highlighted snippet, metadata chips (division, author, date, document type).
Three action buttons: **Preview**, **Download**, **Forward**.

- **Preview:** `GET /api/documents/:id/preview` → inline viewer. PDF opens in PDF viewer. DOCX/XLSX render as read-only if possible, otherwise prompt download.
- **Download:** `GET /api/documents/:id/download` → triggers file download.
- **Forward:** recipient picker modal → `POST /api/inbox/forward`.

**No results:** "No documents found matching '[query]'. Try different keywords or use Ask SKMS for a synthesised answer." Ask SKMS text is a button that opens the AI panel.

**Clear button:** clears input, clears results, shows browse list again.

### Browse Panel
Filter controls:
- **Name input:** client-side filter, debounced
- **Division dropdown:** re-fetches with query param
- **Document type dropdown:** re-fetches with query param
- **Research area dropdown:** re-fetches with query param

Table columns: document name with type chip, project + division, research area, uploaded by + date, three icon action buttons (Preview, Download, Forward).

Load more → append next page to list.

## Publishing to Library
Happens from My Activities, Project Detail Documents tab, or Inbox. Not from the Library page itself. Published documents appear in the browse list immediately after `PATCH /api/documents/:id { published: true }`.

## Edge Cases
- **Empty state (Admin only):** "The library has no published documents yet."
- **Empty state (other roles):** "No documents match your filters." + Clear filters button.
