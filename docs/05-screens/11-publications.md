# WF11 — Publications

## Purpose
Track the institute's scholarly output (papers, theses, reports) through Draft → Submitted → In Revision → Published stages.

## Entry Points
- Sidebar "Publications" link

## Data Fetched on Mount
- `GET /api/publications` → all tracked publications
- `GET /api/publications/pipeline` → `{ draft, submitted, inRevision, published }` counts

## Layout

### Four Stat Cards (informational)
Total tracked, Published (green), In progress (amber), Published this year.

### Pipeline Strip
Four stage boxes in a row: Draft, Submitted, In revision, Published — each showing its count. Informational only, not filters.

### Five Tabs
- **All** → full list
- **Mine** → `submittedBy=me`
- **Published** → `status=PUBLISHED`
- **In progress** → `status!=PUBLISHED && status!=DRAFT`
- **CCST student work** → `type=STUDENT`

### Publication Cards (not table rows)
Each card:
- **Top row:** full paper title + status badge
- **Authors line**
- **Metadata row:** journal name or target journal, date, linked project name
- **Action buttons** at bottom

### Status-Specific Behaviour

**Published:**
- DOI link → external link, opens in new tab
- Download PDF button (if manuscript stored)
- Edit record button → modal to update metadata

**Submitted:**
- Target journal + submission date
- Update status button → modal to change stage (e.g., mark as In revision or Published)
- View manuscript button (if file stored)

**In Revision:**
- R&R received date + revision due date
- If revision due within 60 days → deadline alert button (amber): "Revision due in N weeks"
- Update status button
- Revision due date stored in backend; backend generates alert when within 60 days

**Draft:**
- Card visually muted (reduced opacity)
- Update record button only

### Add Publication Button (top right)
Modal form fields:
- Title (required)
- Authors (required)
- Type: Paper / Thesis / Report (required)
- Status: Draft / Submitted / In revision / Published (required)
- Journal name or target journal
- Linked project selector
- DOI (only if Published)
- Manuscript file upload (optional)

`POST /api/publications` → card appears at top of list on success.

## Edge Cases
- **CCST student work tab:** Type = STUDENT. Shows thesis title, student name, supervisor, degree programme, submission date instead of journal metadata.
- **Management/Division Head:** see all publications. Researcher sees all but can only edit their own. Add publication button hidden for Secretary and Admin.
