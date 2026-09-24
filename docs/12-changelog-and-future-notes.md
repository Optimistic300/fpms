# Changelog & Future Notes

A running, honest record of notable changes and open items — kept current, unlike
`handoff.md` (historical). Each entry is marked **Done**, **In Progress**, or **Open**
so this stays trustworthy: nothing here is claimed finished unless it's actually been
verified working.

## Changelog

- **Done** — Report review authority moved from the Scientific Secretary to each
  project's own lead researcher. Secretary keeps view/record-keeping access only.
- **Done** — Shared polymorphic comments system added to Projects, Activities,
  Documents, and Publications (one `comments` table, reused `view` policies).
- **Done** — Forest-green FORIG branding applied (design tokens, Dashboard components).
- **Done** — Project deletion added.
- **Done** — Fixed several Postgres-deployment blockers found while shipping to Render:
  missing `use` imports in `AppServiceProvider`/`EventServiceProvider` causing binding
  resolution failures; `fullText()` migrations (MySQL-only, no Postgres support) blocking
  `migrate`; a nonexistent `App\Jobs\Middleware\WithoutOverlapping` class crashing all
  document indexing.
- **Done** — New projects now start as `ACTIVE` immediately instead of `PROPOSED`. Previously
  there was no UI path to ever activate a proposed project, so reports could never be
  submitted against a newly created one.
- **Done** — `league/flysystem-aws-s3-v3` installed so `FILESYSTEM_DISK=s3` (Cloudflare R2
  or any S3-compatible provider) actually works. Needed because Render's local disk does
  not persist across redeploys — previously uploaded documents silently lost their file
  content on every redeploy.
- **In Progress** — AI Assistant rebuilt on Gemini (embeddings + generation) with real
  pgvector similarity search on Postgres, replacing the old MySQL-only full-text search
  that never worked on Render. The indexing pipeline and Gemini wiring are fixed and
  confirmed not to crash, but a full end-to-end "ask a real question, get a real answer"
  test is still blocked on the R2 file-storage migration above (documents need to be
  re-uploaded once R2 is actually configured, since their old files are gone).

## Open items for future versions

- **Real email provider.** Render blocks outbound SMTP (confirmed — Gmail SMTP times out
  from Render's network). A switch to an HTTP-based provider (Resend was proposed) was
  discussed but **not yet completed** — email notifications on the live deployment are
  currently non-functional until this is done.
- **AI retrieval is per-document, not per-chunk.** The current implementation embeds each
  whole document as one vector, not the finer-grained chunk-level retrieval the original
  design docs (`06-ai-assistant.md`) describe via Meilisearch/Scout. Works for a small
  library; revisit if retrieval quality or document count grows.
- **Accidentally-committed tooling files.** `.agents/`, `.opencode/`, `.impeccable/` (a
  16MB binary among them) — unrelated AI-coding-tool config that got swept into a commit.
  Flagged, not yet cleaned up.
- **Admin-provisioned accounts only, by design.** No self-registration exists or is
  planned — new users are created by an ADMIN via User Management. Documented here so
  it isn't mistaken for a missing feature later.
- **Institutional email.** Gmail SMTP is a stand-in for demo purposes; the institution's
  real mailbox (`notifications@forig.org`) should replace it before real production use.
- **Document/Publication comments verified at the model level only.** Project and Activity
  comment endpoints were confirmed working through a real HTTP request; Document and
  Publication were verified via direct model relations locally (no documents/publications
  existed to test the actual endpoints against). Worth a live check once real data exists.
