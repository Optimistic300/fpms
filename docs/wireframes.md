**WF 01 --- Shell**

![](./images/image1.png){width="6.991666666666666in"
height="4.952083333333333in"}

This is the layout wrapper. Build this before any page.

**Four regions:**

-   Top nav bar --- fixed, always visible

-   Left sidebar --- navigation links, role-aware

-   Content area --- all pages render here, only this changes on
    navigation

-   Floating AI button --- gold circle, position: fixed, bottom-right,
    global component mounted at app root

**Top nav --- left to right:**\
Logo → action buttons (Log activity, New project) → bell with unread
badge → avatar with initials. Hide action buttons for SECRETARY and
ADMIN, show role tag pill instead.

**Sidebar sections:**

-   Workspace: Dashboard, Projects, My Activities, Reports

-   Institute: Library, Publications, Inbox

-   Role additions: Secretary gets Report Queue + Submission History.
    Division Head gets Division Overview. Management gets Executive
    Dashboard. Admin gets only User Management + Settings --- replaces
    everything else.

Active item = white background + border + bold. Badges on Reports and
Inbox showing pending counts.

**Bell:** Fetch unread count on mount, poll every 60 seconds. Click =
dropdown tray, not a page.

**Floating AI button:** Opens AI panel as right slide-in overlay. Page
dims behind it. Persists across all route changes --- never remounts.

**Mobile (\<768px):** Sidebar hides → bottom tab bar (Dashboard,
Projects, Log, Library, Inbox). AI button moves to bottom-left.

**You know it works when:** Each role sees the right sidebar items. Nav
and sidebar stay put while content area changes. Mobile breakpoint
switches correctly.

**\
**

**WF 02 --- Login**

![](./images/image2.png){width="6.5in"
height="4.880702099737533in"}

This is the only public screen. No auth required.

**Two panels side by side:**

Left panel is brand only --- logo, system name, one-line tagline, and
three live numbers (active projects, library documents, divisions
connected). These three numbers come from a public endpoint --- no token
needed. Fetch on mount, display as soon as they arrive. On mobile this
panel collapses to just the logo above the form.

Right panel is the form --- work email, password, forgot password link,
sign in button. No register option anywhere. Below the button a note
tells users to contact their administrator for access.

**On submit:**\
POST /api/auth/login → receive { token, userId, fullName, email, role,
division } → store token and user object in auth context and
localStorage → redirect based on role:

-   RESEARCHER / STUDENT → /dashboard

-   SECRETARY → /queue

-   DIVISION_HEAD → /division

-   MANAGEMENT → /executive

-   ADMIN → /users

**Edge cases:**

-   Wrong credentials → inline error below password field. No toast.

-   Token found in localStorage on app load → validate it before
    redirecting. If expired → clear and stay on login.

**\
**

**WF 03 --- Dashboard**

![](./images/image3.png){width="6.5in"
height="6.732974628171479in"}

Landing screen for RESEARCHER and STUDENT after login.

**On mount, four fetches:**

-   /api/dashboard/stats → { totalProjects, ongoing, reportsPending,
    activitiesThisMonth }

-   /api/projects?owner=me&limit=20 → project list

-   /api/activities?owner=me&limit=3 → recent activities

-   /api/reports?owner=me&limit=3 → recent report statuses

**Page header:**\
Greeting with user\'s first name, today\'s date, and their division
name.

**Four stat cards:**\
Each is a clickable filter. Active card gets accent border + tinted
background. Micro-hint \"click to filter\" always visible below each
label.

-   My projects → shows all user projects in table below

-   Ongoing → filters table to status=ONGOING

-   Reports pending → navigates to /reports?status=PENDING

-   Activities this month → navigates to /activities?period=this-month

**Project table:**\
Columns: project title (full, ellipsis on overflow), division, funding,
status badge, progress bar. Search input filters client-side on title as
user types (debounce 300ms). Status dropdown re-fetches with ?status=
param. Advanced filters toggle reveals division, funding, research area.
Row click → /projects/:id.

**Bottom two panels:**\
Left --- Recent Activity: last 3 activities, description + project +
date. \"View all\" → /activities.\
Right --- Report Status: last 3 reports with status badge. Returned
reports highlighted red. \"View all\" → /reports.

**Skeleton loaders** on all four regions while data is fetching. Never a
blank page.

### WF 04a --- Project Directory

### ![](./images/image4.png){width="6.5in" height="5.114251968503937in"}

All roles can see this. Access to contents is controlled by ownership.

**On mount:**\
GET /api/projects → returns all projects. Each project in the response
includes isOwner: bool, hasAccess: bool, isLocked: bool.

**Three tabs:**

-   All projects → full list

-   My projects → filter to isOwner: true

-   Shared with me → filter to hasAccess: true && !isOwner

**Table columns:**\
Title, division + lead, funding, status badge. Two visual indicators on
the title cell:

-   \"Mine\" tag → if isOwner: true

-   Lock icon → if isLocked: true

**Row click:**

-   isOwner: true or hasAccess: true → /projects/:id (full detail)

-   isLocked: true → /projects/:id/preview (public metadata only +
    request access button)

**Filter bar:**\
Search input filters client-side on title, lead, research area. Three
chips --- division, status, funding --- re-fetch with query params on
change.

**New Project button:**\
Top right of page. Opens modal with fields: title, division, funding
type, research area, location, start date, end date, description. POST
/api/projects → on success navigate to /projects/:newId.

**Edge case:**\
If the projects list is empty for \"Shared with me\" tab → empty state
with text \"No projects have been shared with you yet\" and no CTA (you
can\'t request access from here --- you do that from the project preview
page).

### WF 04b --- Project Detail

### ![](./images/image5.png){width="6.499298993875765in" height="4.958333333333333in"}

Full view of a single project. Reached by clicking any accessible row in
the directory.

**On mount:**\
GET /api/projects/:id → if 403 returned → redirect to
/projects/:id/preview immediately.

**Breadcrumb:**\
\"Projects › \[Project title\]\" --- clicking \"Projects\" navigates
back to /projects.

**Header:**\
Full project title, status badge, lead researcher, division, funding
source, date range, progress bar. Two buttons --- Edit and Log activity
--- visible only if isOwner: true.

Edit → PUT /api/projects/:id in a modal.\
Log activity → /log-activity?projectId=:id.

**Four tabs --- default is Activities:**

**Activities tab:**\
GET /api/activities?projectId=:id. Each row: description, date,
researcher, doc count. Row click → inline expand showing notes and
attached documents. Each document has Download, Publish to library, and
Forward icon buttons.

**Documents tab:**\
GET /api/documents?projectId=:id. Each row: type chip, filename,
Download, Publish, Forward. Publish → confirm modal → PATCH
/api/documents/:id { published: true }.

**Reports tab:**\
GET /api/reports?projectId=:id. Each row: report name, period, status
badge, submitted date. Row click → /reports/:id.

**Team tab:**\
GET /api/projects/:id/members. Each row: researcher name, role (Lead /
Collaborator), date added. Share access button → modal with email/name
search → POST /api/projects/:id/members.

**Right sidebar:**\
Project metadata (research area, location, dates, funding, activity
count, doc count). Recent documents list with quick download. Three
action buttons: Submit report → /reports/new?projectId=:id. Share access
→ same modal as team tab. Publish to library → only visible if user has
publish permission.

**Locked project preview /projects/:id/preview:**\
Shows only: title, lead, division, status, research area, start and end
dates. No tabs. No documents. No activities. One button --- Request
access → POST /api/projects/:id/access-requests → success toast \"Access
request sent.\"

### WF 05a --- Log Activity

### ![](./images/image6.png){width="6.499416010498687in" height="4.65in"}

Three-step form. Step indicator always visible at the top showing
current position.

**Entry points:**

-   Nav \"Log activity\" button

-   Project Detail header button

-   My Activities page button

-   All accept ?projectId= query param to pre-fill the project selector

All form data lives in component state across all three steps. Nothing
is submitted until Step 3.

**Step 1 --- Details:**

Fields:

-   Project selector --- pre-filled if projectId in URL. Required.

-   Date --- defaults to today. Required.

-   Activity type --- no default, required. Options from GET
    /api/activity-types.

-   Description --- text input. Required.

-   Notes --- textarea. Optional.

Next button → validates all required fields → if any empty show inline
error below that field → if all valid advance to Step 2.

**Step 2 --- Attach files:**

Shows upload zone and list of queued files. Nothing uploads yet ---
files sit in state.

-   Add file → appears in list with filename, size, and remove (X)
    button

-   Remove → removes from state only, no API call

-   Skip → advances to Step 3 with empty file list

-   Back → returns to Step 1, all data preserved

**Step 3 --- Confirm:**

Summary of everything: project name, date, type, description, notes,
file list.

Submit →

1.  POST /api/activities with activity data → receive activityId

2.  For each file → POST /api/activities/:activityId/documents
    (multipart)

3.  Files upload sequentially, each showing progress

4.  If a file fails → show error on that file with retry. Don\'t block
    the others.

5.  On all complete → navigate to /projects/:projectId Activities tab

Back → returns to Step 2, files still queued.

**Edge case:**\
If user arrived without a projectId and selects a project in Step 1,
carry that projectId through to the post-submit redirect.

### WF 05b --- My Activities

### ![](./images/image7.png){width="6.499298993875765in" height="4.675in"}

Full personal activity history across all projects.

**On mount:**\
GET /api/activities?owner=me&page=1&limit=20

**Filter bar:**

-   Search → debounced client-side filter on description

-   Project dropdown → re-fetch with ?projectId=

-   Type dropdown → re-fetch with ?type=

-   Export CSV button → GET /api/activities?owner=me&format=csv with
    current filters applied. Triggers file download.

**Table columns:**\
Date, description, project (truncated with full title on hover tooltip),
activity type, file count badge, chevron.

**Row click → inline expand:**

Shows:

-   Full notes text

-   Document list --- each row: type chip, filename, then four icon
    buttons:

    -   Download → GET /api/documents/:id/download

    -   Publish → confirm modal → PATCH /api/documents/:id { published:
        true }

    -   Forward → recipient picker modal → POST /api/inbox/forward

    -   Delete (X) → confirmation modal: \"Remove \[filename\]? This
        cannot be undone.\" → DELETE /api/documents/:id → remove from
        list on success

Below document list:

-   Edit activity → modal with pre-filled fields → PUT
    /api/activities/:id

-   Delete activity → confirmation modal: \"Delete this activity and
    \[N\] attached documents? This cannot be undone.\" → DELETE
    /api/activities/:id → row disappears on success, update total count
    in header

**Load more:**\
Button at bottom of list. Fetches next page appending to existing list.
Hide button when no more pages.

**Empty state:**\
\"No activities logged yet.\" + Log activity button.

### WF 06a --- Submit Report

### ![](./images/image8.png){width="6.383333333333334in" height="4.399854549431321in"}

Four-step formal submission flow. Step indicator always visible at top.

**Entry points:**

-   Sidebar Reports → New report button

-   Project Detail sidebar CTA

-   My Reports page New report button

-   All accept ?projectId= to pre-fill

All data lives in component state. Nothing submitted until Step 4.

**Step 1 --- Select project:**\
Dropdown of user\'s active projects. Pre-filled if projectId in URL.
Next → requires selection.

**Step 2 --- Report details:**

-   Report type → Quarterly, Mid-year, Annual. No default. Required.

-   Period start date → required

-   Period end date → defaults to today. Required.

-   Narrative summary → textarea. Required.

Next → validates all fields. Back → returns to Step 1, data preserved.

**Step 3 --- Attach report:**\
Single file upload. PDF expected. After upload shows filename, type,
size with a remove option. Back → returns to Step 2, file cleared from
state.

**Step 4 --- Confirm:**\
Full summary of all fields. Non-dismissible warning: \"Once submitted
you cannot edit this report. The Secretary can return it with comments
if changes are needed.\"

Two buttons:

-   Edit report → back to Step 2

-   Submit to Scientific Secretary → POST /api/reports with all data +
    file → on success navigate to /reports → Secretary receives inbox
    notification automatically from backend

**Save as draft:**\
Available on Steps 1--3. POST /api/reports/draft with current state →
navigate to /reports. Draft appears with Continue action.

**Edge case:**\
If user navigates away mid-flow without saving → show browser confirm
\"You have unsaved changes. Leave anyway?\" Use the beforeunload event.

### WF 06b --- My Reports

### ![](./images/image9.png){width="6.499449912510936in" height="5.25in"}

Status tracker for all the user\'s report submissions.

**On mount:**\
GET /api/reports?owner=me → all submissions including drafts, sorted by
createdAt descending.

**Page header:**\
Total submission count. \"Needs attention\" count = Returned + overdue
Draft count. New report button → /reports/new.

**Table columns:**\
Report name + period, project, submission date, status badge, action
button.

Status badges:

-   Draft → grey

-   Pending review → amber

-   Returned → red, row gets red background tint

-   Approved → green

Action buttons:

-   Draft → \"Continue\" → resumes step flow from last completed step

-   Pending → no action

-   Returned → \"Resubmit\" →
    /reports/new?projectId=:id&resubmit=:reportId

-   Approved → \"View\" → read-only report detail

**Row click → inline expand (submission timeline):**

Each event in the report\'s history rendered chronologically with exact
timestamps:

-   Submitted → \[timestamp\] · \[researcher name\]

-   Returned with comments → \[timestamp\] · \[Secretary name\]

-   Secretary\'s comment verbatim inside red-tinted block

-   Resubmitted → \[timestamp\]

-   Approved → \[timestamp\] · \[Secretary name\]

Resubmit button sits directly below the Secretary\'s comment block.
Navigates to /reports/new?projectId=:id&resubmit=:reportId which
pre-fills all original fields for editing before resubmission.

**Edge case:**\
Resubmission should POST as a new report linked to the original via
parentReportId. Backend should increment the version number. Secretary
sees \"v2 (resubmission)\" in the review screen.

### WF 07a --- Report Queue

### ![](./images/image10.png){width="6.499518810148731in" height="4.508333333333334in"}

Secretary\'s primary workspace. Landing screen after login for SECRETARY
role.

**On mount:**

-   GET /api/reports?status=PENDING → sorted by submittedAt ascending
    (oldest first)

-   GET /api/reports/stats → { overdue, pending, approvedThisQuarter,
    returned }

**Four stat cards:**

-   Overdue (red) → reports where submittedAt is more than 7 days ago
    and still PENDING

-   Pending review → total pending count

-   Approved this quarter → informational

-   Returned for revision → informational

Cards are informational only --- not filters.

**Filter bar:**

-   Search → filter by researcher name, project name, division

-   \"Pending only\" chip → active by default. Toggle to show all
    statuses.

-   Division chip → re-fetch with ?division=

-   Report type chip → re-fetch with ?type=

**Table columns:**\
Report name + period, researcher + division, project, type badge, days
waiting, Review button.

Days waiting = today minus submittedAt in days.

Overdue rows (\>7 days):

-   Red left border accent

-   Type badge changes to red \"Overdue\"

-   Sorted to top of list regardless of other sorting

Review button → /queue/:reportId

**Empty state:**\
\"No reports pending review.\" Green check icon. No CTA needed ---
Secretary has nothing to action.

**Load more:**\
Same pattern as other list screens. 20 per page, append on load more.

### WF 07b --- Report Review

### ![](./images/image11.png){width="6.499648950131234in" height="4.657638888888889in"}

Opens when Secretary clicks Review on any queue item.

**On mount:**

-   GET /api/reports/:id → full report with narrative, file, submission
    history

-   GET
    /api/reports?projectId=:projectId&submittedBy=:researcherId&status=APPROVED
    → prior approved reports for context panel

**Breadcrumb:**\
\"Report queue › \[Report name\]\" --- clicking \"Report queue\" returns
to /queue.

**Queue navigation (top right):**\
\"N of M in queue\" --- N is current position, M is total pending count.
Next → fetches next oldest pending report and navigates to
/queue/:nextReportId. Clicking Next without actioning leaves current
report in queue unchanged.

**Two column layout:**

**Left column:**

-   Report title, researcher, division, period, submission timestamp

-   Narrative summary in tinted panel

-   Attached file row: type chip, filename, size, Preview button (inline
    viewer), Download button

-   Prior approved submissions list: filename + approval date + view
    button per row

**Right column --- action panel:**

-   Submission details: type, version number, days waiting, prior
    approved report count

-   Comment textarea --- label says \"Required for return and
    escalation\"

-   Three action buttons stacked vertically:

    -   Approve (green) → validate comment optional → PATCH
        /api/reports/:id { status: \"APPROVED\", comment } → researcher
        notified by backend → navigate to next in queue

    -   Return for revision (red) → validate comment required, show
        inline error if empty → PATCH /api/reports/:id { status:
        \"RETURNED\", comment } → researcher notified → navigate to next

    -   Escalate to management (purple) → validate comment required →
        PATCH /api/reports/:id { status: \"ESCALATED\", comment } →
        management notified → navigate to next

-   Note below buttons: \"All decisions are timestamped and recorded.
    The researcher is notified immediately.\"

**Edge cases:**

-   If Secretary clicks Next without actioning → report stays PENDING,
    position in queue unchanged

-   If queue is now empty after actioning → navigate to /queue with
    empty state

-   All three action buttons disabled while API call is in flight.
    Spinner on active button.

### WF 08 --- Division Dashboard

### ![](./images/image12.png){width="6.4995155293088365in" height="7.716666666666667in"}

Landing screen for DIVISION_HEAD after login.

**On mount:**

-   GET /api/divisions/:divisionId/stats → stat card values

-   GET /api/projects?division=:divisionId → division projects

-   GET /api/divisions/:divisionId/researcher-activity → per-researcher
    summary

-   GET /api/reports?division=:divisionId&limit=5 → recent report
    statuses

-   GET /api/divisions/:divisionId/activity-feed?limit=10 → event feed

:divisionId comes from the logged-in user\'s profile stored in auth
context.

**Five stat cards:**\
Total projects, Ongoing, Reports pending (amber if \>0), Report overdue
(red if \>0), Active researchers. All informational --- not filters.

**Two column layout:**

**Left column:**

Division Projects table:

-   Columns: project title, lead researcher, status badge, progress bar

-   All rows open in full --- no lock restrictions for Division Head
    within their own division

-   Row click → /projects/:id

-   \"View all \[N\] →\" → /projects?division=:divisionId

Division Report Status panel below projects table:

-   Lists recent report submissions from all division researchers

-   Columns: report name, researcher, submitted date, status badge

-   \"All reports →\" → /reports?division=:divisionId

**Right column:**

Researcher Activity table:

-   One row per researcher in the division

-   Columns: name + active project count, projects, activities this
    month, documents uploaded, report status badge

-   Report status badges: Submitted (green), Due soon (amber --- due
    within 7 days), Overdue (red --- past due date)

-   Row click → /activities?researcher=:researcherId

Activity Feed panel below researcher table:

-   Chronological stream of all activities and documents across the
    division

-   System-generated alerts mixed in --- rendered with warning icon,
    amber colour

-   Example alert: \"S. Mensah Q2 report not yet submitted --- due 30
    Jun\"

-   \"View all →\" → full feed page

**Division Head\'s own workspace:**\
Division Head is still a researcher. My Activities and My Reports in the
sidebar still work and are scoped to their own data only --- not the
whole division.

### WF 09 --- Executive Dashboard

### ![](./images/image13.png){width="6.499945319335083in" height="7.798611111111111in"}

Landing screen for MANAGEMENT after login. Institute-wide, no
restrictions.

**On mount:**

-   GET /api/institute/stats → six stat card values

-   GET /api/divisions/summary → one row per division

-   GET /api/institute/funding-breakdown → donor/government/internal
    counts

-   GET /api/institute/compliance → per-division compliance percentages

-   GET /api/publications?limit=4 → recent publications

-   GET /api/institute/alerts?limit=5 → system-generated alerts

**Six stat cards:**\
Total projects, Ongoing (green), Divisions active, Reports pending
review (amber), Reports overdue (red), Library documents (green). All
informational.

**Division Breakdown table (full width):**

One row per division. Columns: division name + head, total projects,
ongoing, active staff, document count, report status summary, compliance
%.

Compliance colouring:

-   100% → green

-   80--99% → amber

-   Below 80% → red

Row click → navigates to that division\'s dashboard at
/division?divisionId=:id. Management can view any division\'s dashboard.

**Three panels below the table:**

**Funding Breakdown panel:**\
Three horizontal bars --- Donor, Government, Internal. Width
proportional to project count. Label shows count on the right.

Below bars --- compliance bar chart. One bar per division. Same colour
rules as the table. Division name on left, percentage on right.

**Publications Output panel:**\
Each entry: status badge, title, authors, journal, date. \"All
publications →\" → /publications.

**Institute Alerts panel:**\
System-generated only. Icon colours: red = danger, amber = warning,
green = success, blue = info.

Alert types backend generates:

-   Report overdue in a division

-   Secretary queue backlog above threshold

-   Division milestone (all reports submitted)

-   Library document count milestone

-   Paper status change (submitted, published)

Each alert has a → button navigating to the relevant screen.

**Edge case:**\
All six data fetches fire in parallel on mount --- use Promise.all. If
any single fetch fails show an error banner for that section only. Never
fail the whole page because one panel errored.

### WF 10 --- Library

### ![](./images/image14.png){width="6.5in" height="8.467700131233595in"}

Accessible to all roles. Permanent institutional knowledge base.

**On mount:**

-   GET /api/library/stats → total count, per-division counts, added
    this quarter

-   GET /api/library/documents?page=1&limit=20 → initial browse list

**Four stat cards:**\
Total documents, top three contributing divisions by count.
Informational only.

**Full-Text Search panel:**

Search input + Search button + Clear button.

On submit → GET /api/library/search?q=:query

Response includes snippet field --- highlighted HTML with search terms
wrapped in \<mark\> tags. Backend must strip all other HTML before
returning. On the frontend sanitise with DOMPurify before rendering with
dangerouslySetInnerHTML. Never render raw backend HTML without
sanitising first.

**Result card:**\
Type chip, document title, highlighted snippet, metadata chips
(division, author, date, document type). Three action buttons: Preview,
Download, Forward.

-   Preview → GET /api/documents/:id/preview → inline viewer. PDF opens
    in a PDF viewer component. DOCX and XLSX render as read-only where
    possible, otherwise prompt download.

-   Download → GET /api/documents/:id/download → triggers file download

-   Forward → recipient picker modal → POST /api/inbox/forward {
    documentId, recipientIds, message }

No results → \"No documents found matching \'\[query\]\'. Try different
keywords or use Ask SKMS for a synthesised answer.\" Ask SKMS text is a
button that opens the AI panel.

Clear button → clears input, clears results, shows browse list again.

Warning banner below results --- always visible when results are
showing: \"This is full-text search, not AI. For a synthesised answer
use the Ask SKMS button.\" Never dismissible.

**Browse panel:**

Filter controls: name input (client-side filter, debounced), division
dropdown, document type dropdown, research area dropdown. All re-fetch
with query params on change except name which filters client-side.

Table columns: document name with type chip, project + division,
research area, uploaded by + date, three icon action buttons (Preview,
Download, Forward).

Load more → append next page to list.

**Empty state:**\
\"The library has no published documents yet.\" Only visible to Admin.
For other roles: \"No documents match your filters.\" + Clear filters
button.

**Publishing to library:**\
Happens from My Activities, Project Detail Documents tab, or Inbox. Not
from the Library page itself. Published documents appear in the browse
list immediately after PATCH /api/documents/:id { published: true }.

### WF 11 --- Publications

### ![](./images/image15.png){width="6.5in" height="8.354987970253719in"}

Tracks the institute\'s scholarly output. Accessible to all roles but
only researchers can add and update their own publications.

**On mount:**

-   GET /api/publications → all tracked publications

-   GET /api/publications/pipeline → { draft, submitted, inRevision,
    published } counts

**Four stat cards:**\
Total tracked, Published (green), In progress (amber), Published this
year. Informational only.

**Pipeline strip:**\
Four stage boxes in a row --- Draft, Submitted, In revision, Published
--- each showing its count. Informational only, not filters. Gives a
at-a-glance view of where the institute\'s papers sit right now.

**Five tabs:**

-   All → full list

-   Mine → submittedBy=me

-   Published → status=PUBLISHED

-   In progress → status!=PUBLISHED && status!=DRAFT

-   CCST student work → type=STUDENT

**Publication cards:**

Each publication is a card, not a table row. Cards have more content
than a table row can hold cleanly.

Card structure:

-   Top row: full paper title + status badge

-   Authors line

-   Metadata row: journal name or target journal, date, linked project
    name

-   Action buttons at bottom of card

Status badge drives what actions and info show:

**Published:**

-   DOI link → external link opens in new tab

-   Download PDF button if manuscript stored

-   Edit record button → modal to update metadata

**Submitted:**

-   Target journal + submission date

-   Update status button → modal to change stage (e.g. mark as In
    revision, or Published)

-   View manuscript button if file stored

**In revision:**

-   R&R received date + revision due date

-   If revision due within 60 days → deadline alert button shown in
    amber: \"Revision due in N weeks\"

-   Update status button

-   Revision due date stored in backend --- backend generates alert when
    within 60 days

**Draft:**

-   Card visually muted (reduced opacity)

-   Update record button only

**Add publication button (top right):**\
Modal form:

-   Title --- required

-   Authors --- required

-   Type: Paper / Thesis / Report --- required

-   Status: Draft / Submitted / In revision / Published --- required

-   Journal name or target journal

-   Linked project selector

-   DOI (only if Published)

-   Manuscript file upload --- optional

POST /api/publications → card appears at top of list on success.

**Edge cases:**

-   CCST student work tab --- these are added by the student or their
    supervisor. Type = STUDENT. They show thesis title, student name,
    supervisor, degree programme, and submission date instead of journal
    metadata.

-   Management and Division Head see all publications across the
    institute. Researcher sees all but can only edit their own. Add
    publication button hidden for Secretary and Admin.

### WF 12 --- Inbox

### ![](./images/image16.png){width="6.315972222222222in" height="6.291523403324584in"}

Receives three types of items: forwarded documents, report status
updates, system alerts.

**On mount:**\
GET /api/inbox?page=1&limit=20 → all items sorted by createdAt
descending.

**Page header:**\
Unread count. Description of the three item types.

**Four tabs:**

-   All → full list

-   Documents → type=DOCUMENT

-   Report updates → type=REPORT_UPDATE

-   System alerts → type=SYSTEM

Tab counts update on mount and after any read action.

**Two buttons on tab row:**

-   Mark all read → PATCH /api/inbox/read-all → clears all badges,
    removes all unread styling

-   Filter unread → toggles list to show only read=false items

**Bulk actions:**\
Checkbox appears on hover per item. Selecting any item → bulk action bar
slides in above the list:

-   \"\[N\] items selected\"

-   Mark read → PATCH /api/inbox/read-all { ids: \[\...selected\] }

-   Download all → sequential download of document-type items in
    selection only

-   Deselect → clears selection, hides bulk bar

**Item rendering:**

Unread item: blue left border, bold subject, blue unread dot on left.\
Read item: no border, normal weight, no dot.

Each item shows:

-   Sender name + division (or \"SKMS · System\" for automated)

-   Subject line

-   One-line preview of message or notification text

-   Type badge: Document (blue), Report update (green), System alert
    (amber)

-   Metadata chips relevant to type

-   Timestamp

**Document item --- click to expand inline:**

-   Full sender message

-   File row: type chip, filename, size

-   Preview button → inline viewer

-   Download button → file download

-   Publish to library button → confirm modal → PATCH /api/documents/:id
    { published: true }

-   Forward button → recipient picker → POST /api/inbox/forward

-   Mark read button → PATCH /api/inbox/:id/read

Preview and Download do NOT trigger mark read. Mark read is always
explicit.

**Report update item:**\
Shows notification text. → button navigates directly to
/reports/:reportId. Clicking → also marks item as read automatically ---
this is the one exception to the explicit read rule because navigation
is the primary action.

**System alert item:**\
Text only. → button navigates to relevant screen. Also marks as read on
navigation.

**Edge cases:**

-   If recipient picker has no results for a search → \"No users found
    matching \'\[query\]\'\"

-   If Download all in bulk includes non-document items in selection →
    skip them silently, only download document-type items

-   Notification bell badge count decrements as items are marked read
    --- keep bell count in sync with inbox read state via shared context

### WF 13 --- AI Assistant

### ![](./images/image17.png){width="6.499925634295713in" height="4.808333333333334in"}

Global overlay. Accessible from every authenticated screen via the gold
floating button.

**Component lives at app root level** --- mounted once, never unmounts.
State persists across all route changes.

**Two states:**

**Closed:** Gold circular button bottom-right (bottom-left on mobile).
On hover expands to show \"Ask SKMS\" label. Click → opens panel.

**Open:** Panel slides in from the right edge. Page behind dims --- CSS
backdrop rgba(0,0,0,0.18), pointer-events: none on the page behind.
Close button (X) in panel header → panel slides out, dim lifts, user is
exactly where they were, scroll position preserved.

**Panel header:**\
Gold sparkle icon, \"Ask SKMS\" title, subtitle \"Searches across all
library documents · always cites sources\", close button.

**Conversation area:**

User messages → dark bubble, right-aligned.\
Assistant messages → light bubble, left-aligned.

**Empty state (no conversation yet):**\
Three suggested prompt chips:

-   \"What has FORIG found about \[user\'s division research area\]?\"

-   \"Which projects are researching \[topic\]?\"

-   \"What reports have been submitted on \[topic\]?\"

Clicking a chip → populates input and submits immediately.

**Sending a message:**

-   Enter submits. Shift+Enter for newline.

-   Input disabled while response loading.

-   POST /api/ai/query { query, conversationHistory: \[\...\] }

-   While waiting → typing indicator (three animated dots) in a light
    bubble on the left.

**Response rendering:**

Parse response text for citation markers \[1\], \[2\] etc. Render each
as a small numbered badge inline in the text.

Below the response text render citation cards in order. Each card:

-   Number badge

-   Document title

-   Author, division, file type, page number

-   External link icon

Click citation card → GET /api/documents/:id/preview → opens inline
viewer. Panel stays open behind the viewer.

**Honest-limits banner** renders below citation cards on every single
response. Never conditional, never dismissible:\
\"This answer draws only from FORIG\'s own library. It is not a
literature review. For published external research use Google Scholar or
Web of Science.\"

**Follow-up prompt chips** render below the banner. Three chips
suggested by the backend based on the query topic. Clicking a chip →
populates input and submits.

**When library cannot answer:**\
Backend returns { canAnswer: false, message: \"The library does not
contain enough information to answer this.\" } Render the message as the
assistant response. No citations. Honest-limits banner still shows.
Follow-up chips show: \"Browse the library →\" (navigates to /library)
and \"Try different terms →\" (clears input and focuses it).

**New conversation button:**\
Small text button in panel header. Clears conversationHistory array in
state. Clears all messages from view. Returns to empty state with
suggested prompt chips.

**Edge cases:**

-   API timeout → show error in assistant bubble: \"Something went
    wrong. Please try again.\" Retry button re-sends the last message.

-   Panel open on mobile → takes full screen width. Close button always
    reachable.

-   User navigates to a different page while panel is open → panel stays
    open, page behind changes, conversation preserved.
