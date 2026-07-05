# Task 021: Library Frontend

**Status:** Not Started
**Depends on:** 006, 010
**Docs referenced:** `docs/05-screens/10-library.md`, `docs/03-api-reference.md` (Library section), `docs/04-frontend-architecture.md` (DOMPurify)

## Objective

Build the Library screen (WF10) — the institute's permanent searchable knowledge base. Users can browse published documents with filters, search via full-text search with highlighted snippets, preview/download/forward documents, and see library statistics.

## Context

The Library is the institutional memory. Approved reports and published documents flow here from the reporting pipeline. All roles can browse, search, preview, download, and forward documents. Publishing happens elsewhere (My Activities, Project Detail, Inbox) — this screen is a read-only consumer of published documents.

## Scope

**In scope:**
- Library stats cards (total documents, top divisions, added this quarter)
- Browse panel: filterable table of all published documents with load-more pagination
- Full-text search panel: search input with highlighted snippets, result cards, warning banner
- Document actions: Preview (inline viewer), Download (file stream), Forward (recipient modal)
- Search result highlighting with `<mark>` tags and DOMPurify sanitization

**Out of scope:**
- Publishing documents to library (happens from other screens)
- AI Assistant (Task 025)
- Document upload (Task 010/016)

## Relevant API contract

- `GET /api/library/stats`
- `GET /api/library/documents` — browse with division, documentType, researchArea filters
- `GET /api/library/search?q=term` — full-text search with `<mark>` snippets
- `GET /api/documents/:id/preview`
- `GET /api/documents/:id/download`
- `POST /api/inbox/forward`

## Relevant frontend behavior

**Four stat cards:** Total documents, three top-contributing divisions by count.

**Full-Text Search Panel:**
- Search input + Search button + Clear button
- Submit → `GET /api/library/search?q=:query`
- Results show: type chip, title, highlighted snippet (DOMPurify sanitized), metadata chips, Preview/Download/Forward buttons
- Warning banner (always visible when results show): "This is full-text search, not AI..."
- No results: "No documents found matching '[query]'. Try different keywords or use Ask SKMS."
- Clear button: clears input, clears results, shows browse list again

**Browse Panel:**
- Filter controls: Name (client-side debounced), Division dropdown, Document type dropdown, Research area dropdown
- Table: document name with type chip, project + division, research area, uploaded by + date, three action icons
- Load more → append next page

**Document actions:**
- Preview → inline viewer (PDF in iframe, DOCX/XLSX → download prompt)
- Download → file download
- Forward → recipient picker modal

**Edge cases:**
- Empty state (Admin only): "The library has no published documents yet."
- Empty state (others): "No documents match your filters." + Clear filters button.

## Architectural conventions that apply

- Frontend sanitizes search snippet HTML via DOMPurify before `dangerouslySetInnerHTML`
- Browse filters use server-side params for dropdown chips, client-side for name search
- Load more appends to existing list (maintain scroll position)
- Preview opens inline viewer panel (could be modal or route with document viewer)
- Forward modal uses existing `POST /api/inbox/forward` endpoint

## Step-by-step implementation checklist

- [ ] Create `resources/js/pages/Library.jsx`:
  - Fetch stats and browse documents on mount
  - Render stats cards
  - Browse panel with filter controls and table
  - Search panel with input, results, warning banner
  - Toggle between browse and search result views
- [ ] Create `resources/js/components/library/SearchPanel.jsx` — search input, result cards with DOMPurify snippets, warning banner, no-results state
- [ ] Create `resources/js/components/library/BrowsePanel.jsx` — filter controls, document table, load more
- [ ] Create `resources/js/components/library/DocumentPreview.jsx` — inline viewer modal/panel for PDF
- [ ] Create `resources/js/components/library/ForwardModal.jsx` — recipient picker, POST forward
- [ ] Add route: `/library` → Library
- [ ] Wire sidebar "Library" link

## Definition of done

- Library stats cards show total documents and top divisions
- Browse panel shows published documents with working filter dropdowns
- Client-side name search filters table
- Load more pagination appends rows, maintains scroll position
- Search panel returns results with highlighted `<mark>` snippets
- Warning banner visible when search results shown
- No results state shows "No documents found..." with Ask SKMS button
- Clear button resets to browse view
- Preview opens inline viewer for PDFs, shows download prompt for DOCX/XLSX
- Download triggers file download
- Forward opens recipient picker and sends
- Empty states correct per role (Admin vs others)
- DOMPurify sanitizes snippet HTML

## Open questions / assumptions inherited

- **DOCX/XLSX preview:** v1 returns download prompt per `09-open-questions-and-assumptions.md`.
- **Library search uses basic LIKE for v1** — FULLTEXT search with AI indexing is Task 024.
