# Open Questions and Assumptions

## Wireframe Images Not Available

**Stat:** The wireframes document (`docs/wireframes.md`) references 17 screen images (`./images/image1.png` through `./images/image17.png`) that do not exist in the repository — the `docs-source/images/` directory is absent. The source documents live at `docs/`, not `docs-source/`, and the images were never committed.

**Impact:** Visual layout details (exact spacing, component positioning, colour swatches, iconography) could not be verified from the screenshots. All screen docs in `05-screens/` were derived solely from the written annotations in the wireframes markdown file. Where the written annotations describe layout (e.g., "Two panels side by side", "Bottom two panels"), those have been followed faithfully. Pure visual details (font sizes, exact border radii, icon choices) are the implementer's interpretation.

**No mitigation needed for the images — this note is the mitigation.**

## HIGHEST PRIORITY: Semantic Search Retrieval Mechanism

**Question:** Will MySQL Full-Text Search with application-layer re-ranking provide adequate retrieval quality for the AI Assistant, or is a dedicated vector/semantic search store (Meilisearch, Typesense, Pinecone) required?

**Assumption made:** MySQL FTS + re-ranking is sufficient for v1 at FORIG's expected document volume (hundreds to low thousands). The `AiRetrievalInterface` contract makes this swappable without touching calling code.

**Risk:** If FTS relevance proves inadequate in user testing, or if document volume exceeds ~10,000, a migration to a vector-capable store will be needed. This is explicitly flagged in `06-ai-assistant.md` and should be revisited during the pilot phase.

## Admin Screens Not Specified

**Gap:** WF01 states Admin gets "User Management + Settings" as their entire sidebar, but no wireframe exists for either screen.

**Assumption made:** Minimum viable Admin capability defined in `01-roles-and-permissions.md`:
- User Management: view all users, create users, deactivate/reactivate users, assign roles and divisions, reset passwords.
- Settings: division management, document type options, activity type options.

**Recommendation:** Wireframes for these screens should be created before implementation begins.

## Forgot Password Flow Not Specified

**Gap:** WF02 has a "forgot password?" link but no wireframe or API endpoint defined for password reset.

**Assumption made:** Implement a standard email-based password reset flow:
1. User clicks "forgot password?" → enters email
2. `POST /api/auth/forgot-password` sends a reset link to the registered email
3. User clicks link → enters new password → `POST /api/auth/reset-password`
4. Admin can also reset user passwords from User Management

**This is a minimal default.** No custom screens were designed; reuse Laravel's built-in password reset notification and views.

## Secretary and Admin Display in Top Nav

**Question:** The wireframes say to hide action buttons (Log Activity, New Project) for SECRETARY and ADMIN and "show role tag pill instead." The exact appearance of the role tag pill is not specified.

**Assumption:** A small coloured badge/tag showing the role name (e.g., "Secretary", "Admin") displayed in the top nav bar where the action buttons would normally appear.

## Notification Bell Polling vs. Real-Time

**Decision (v1):** Polling-based, 60-second interval. Documented in `07-non-functional-requirements.md`.

**Assumption:** 60-second polling is acceptable for v1 usage patterns. Real-time delivery (WebSockets) is architecturally supported via the Events layer and can be added later by implementing `ShouldBroadcast` on event classes.

## AI Assistant Model Provider

**Question:** Which LLM/provider should serve the AI Assistant?

**Assumption:** The `AiRetrievalInterface` contract abstracts the provider. For v1, an OpenAI-compatible API (or a local model via Ollama/Llama.cpp) can be used. The choice depends on:
- Budget for API costs (OpenAI, Anthropic)
- Data residency requirements (may favour a local model)
- Quality requirements for synthesis

**This should be decided during the pilot phase.**

## Offline Sync Strategy

**Question:** What happens when offline data conflicts with server state on sync?

**Assumption (v1):**
- Activity logging: offline queued activities are POSTed on reconnect in FIFO order. No conflict resolution needed (new records).
- Draft saving: local drafts are upserted on reconnect.
- Optimistic concurrency (e.g., `updated_at` checks) is deferred to v2 if conflicts emerge.

## File Preview for DOCX/XLSX

**Question:** How should DOCX and XLSX files be previewed inline?

**Assumption:** v1 attempts inline rendering where the browser supports it (e.g., Office Online viewer via URL, or Google Docs viewer). If neither is available, prompt download with the message "Preview not available for this file type. Please download to view."

## Publish to Library — Access Control

**Question:** Which roles can publish documents to the library?

**Assumption:** Any user with project access can publish a document from My Activities, Project Detail, or Inbox. The wireframes show Publish buttons on activity document rows, project document rows, and inbox document items — all visible to users with access. Admin is excluded (handles users/settings only).

## Division Dashboard for Management

**Question:** When Management clicks a division row in the Executive Dashboard, do they see the Division Dashboard page?

**Assumption:** Yes. `GET /api/divisions/:divisionId/stats` and related endpoints are accessible to MANAGEMENT. The frontend navigates to `/division?divisionId=:id` and uses a slightly different layout (no "My Activities" link, since Management has no personal research scope within that division).

## Activity Type Seed Data

**Question:** What activity types should be seeded?

**Assumption:** The `activity_types` table should be seeded with common forestry research activity types at a minimum:
- Field data collection
- Lab work / sample analysis
- Community engagement
- Stakeholder meeting
- Literature review
- Training / workshop
- Equipment maintenance
- Administrative

The Admin Settings screen should allow creating additional types.

## Report Overdue Calculation

**Question:** What defines "overdue"?

**Assumption:** A report is flagged as overdue if it has been in PENDING status for more than 7 days since `submittedAt`. This is calculated by a scheduled command (`CalculateReportOverdue`) and stored as a computed or cached field. The 7-day threshold is configurable.

## Publication Deadline Alerts

**Question:** What defines "revision due soon"?

**Assumption:** A publication with status `IN_REVISION` and a `revisionDueDate` within 60 days of the current date triggers an amber alert on the publication card. This is calculated by a scheduled command (`GenerateDeadlineAlerts`).

## Division for SECRETARY and ADMIN Users

**Question:** Do SECRETARY and ADMIN users belong to a division?

**Assumption:** Yes. Every user has a `divisionId` FK. SECRETARY and ADMIN are assigned to a division for organisational purposes, but their permissions are role-based (not scoped to their division). The division field is metadata only for these roles.

## Inbox and Notifications Table Relationship

**Question:** How does the `inbox_items` table relate to Laravel's native `notifications` table?

**Assumption:** For v1, inbox items are stored in a dedicated `inbox_items` table (as defined in the data model) for the three item types (DOCUMENT, REPORT_UPDATE, SYSTEM). The notification bell's unread count polls the `inbox_items` table. Laravel's `notifications` table is used for database-channel notifications (report status changes, access requests) which also appear in the inbox. A single abstraction layer (InboxService) reads from both sources or the primary `inbox_items` table is populated by notification listeners.

**Simplification for v1:** All inbox items (including notifications) are stored directly in `inbox_items` via Notification classes that write to both `notifications` and `inbox_items`, or by having listeners write to `inbox_items` directly. This avoids dual-source complexity at the cost of some redundancy.
