# Task 022: Publications Frontend

**Status:** Done

## Completion Notes
Completed 2026-07-07. Publications (WF11) with pipeline strip, 5 tabs, CRUD modals, student publications support. 54 new tests. 522 total frontend tests passing.
**Depends on:** 006, 012
**Docs referenced:** `docs/05-screens/11-publications.md`

## Objective

Build the Publications screen (WF11) — tracks the institute's scholarly output through Draft → Submitted → In Revision → Published stages using card-based layout with tabs, pipeline strip, and CRUD modals.

## Context

Researchers and Students track their publications (papers, theses, reports, CCST student work). Management sees all publications institute-wide. Each publication is a card with status-specific behavior: DOI links for published, revision deadlines for in-revision, edit controls for drafts.

## Scope

**In scope:**
- Four stat cards (total, published, in progress, published this year)
- Pipeline strip (four stage boxes with counts)
- Five tabs (All, Mine, Published, In progress, CCST student work)
- Publication cards with status-specific behavior and action buttons
- Add Publication modal
- Edit modal with status updates

**Out of scope:**
- Executive Dashboard publications panel (Task 020 — already references this screen)
- Publication deadline alerts scheduling (Task 026)

## Relevant API contract

- `GET /api/publications` — list with filters (submittedBy, status, type)
- `GET /api/publications/pipeline` — counts by status
- `POST /api/publications` — create
- `PUT /api/publications/:id` — update (status, metadata, manuscript)

## Relevant frontend behavior

**Four stat cards:** Total tracked, Published (green), In progress (amber), Published this year.

**Pipeline strip:** Four stage boxes: Draft, Submitted, In revision, Published — each showing count.

**Five tabs:** All, Mine (`submittedBy=me`), Published (`status=PUBLISHED`), In progress (`status!=PUBLISHED && status!=DRAFT`), CCST student work (`type=STUDENT`).

**Publication cards (not rows):**
- Top: full title + status badge
- Authors line
- Metadata row: journal name, date, linked project name
- Action buttons per status:
  - Published: DOI link (external), Download PDF, Edit record
  - Submitted: Target journal + date, Update status, View manuscript
  - In Revision: R&R received date + revision due date, deadline alert (amber if within 60 days), Update status
  - Draft: Muted opacity, Update record only

**Add Publication modal:** Title, Authors, Type, Status, Journal name, Linked project, DOI (if Published), Manuscript file. POST on submit.

**Edge cases:**
- CCST student tab: shows thesis title, student name, supervisor, degree programme instead of journal metadata
- Management/Division Head: see all; Researcher sees all but can only edit own
- Add button hidden for Secretary and Admin

## Architectural conventions that apply

- Card-based layout (not table rows)
- Tab filter uses query params: `?submittedBy=me`, `?status=PUBLISHED`, `?type=STUDENT`
- Status-specific rendering with conditional fields
- DOI is a clickable external link
- Edit modal re-fetches publication data, submits PUT

## Step-by-step implementation checklist

- [ ] Create `resources/js/pages/Publications.jsx`:
  - Fetch `GET /api/publications` and pipeline on mount
  - Render stat cards
  - Render pipeline strip with counts
  - Render five tabs
  - Render publication cards per active tab
  - Conditional card rendering based on status
- [ ] Create `resources/js/components/publications/PublicationCard.jsx`:
  - Status-specific layout and action buttons
  - DOI external link
  - Revision deadline alert
  - Draft muted styling
  - CCST student fields when type=STUDENT
- [ ] Create `resources/js/components/publications/PipelineStrip.jsx` — four stage boxes
- [ ] Create `resources/js/components/publications/AddPublicationModal.jsx` — form with conditional fields
- [ ] Create `resources/js/components/publications/EditPublicationModal.jsx` — pre-filled form with status update
- [ ] Add route: `/publications` → Publications
- [ ] Wire sidebar "Publications" link

## Definition of done

- Stat cards show correct counts from API
- Pipeline strip shows counts in four stage boxes
- Five tabs filter publications correctly
- Publication cards render with status-specific layout and actions
- Published cards show DOI link and download button
- In Revision cards show revision due date and deadline alert
- Draft cards show muted opacity
- CCST student tab shows student-specific fields
- Add Publication modal creates new publication
- Edit modal updates fields and status
- Add button hidden for SECRETARY and ADMIN
- Empty state is handled

## Open questions / assumptions inherited

None.
