# Task 024: AI Assistant Backend

**Status:** Not Started
**Depends on:** 003, 004, 010
**Docs referenced:** `docs/06-ai-assistant.md`, `docs/03-api-reference.md` (AI Assistant section), `docs/04b-backend-architecture.md` (AiRetrievalInterface, Queued Jobs)

## Objective

Implement the AI Assistant backend: MySQL Full-Text Search retrieval with application-layer re-ranking, the `AiRetrievalInterface` implementation, the document indexing pipeline (DocumentPublished → IndexDocumentForAi), and the `POST /api/ai/query` endpoint that performs retrieval-augmented generation with citation support.

## Context

The AI Assistant ("Ask SKMS") is a RAG (Retrieval-Augmented Generation) system that answers questions from FORIG's own published library documents. For v1, retrieval uses MySQL FULLTEXT search with application-layer re-ranking. The LLM (OpenAI-compatible or local) is called for answer synthesis. Every answer cites its sources and follows strict honesty rules.

## Scope

**In scope:**
- `AiRetrievalInterface` full implementation using MySQL FTS + re-ranking
- `AiQueryResult` DTO (canAnswer, answer, citations, followUpPrompts)
- `DocumentPublished` listener → dispatches `IndexDocumentForAi` job
- `IndexDocumentForAi` job: extracts text from PDF/DOCX/XLSX, stores in `document_texts` table, updates FULLTEXT index
- `POST /api/ai/query` endpoint — accepts query + conversation history, returns answer with citations
- Text extraction for PDF (PHP library), DOCX, XLSX
- Honesty rules: never guess, always cite, honest-limits banner text returned in response
- 30-second timeout on AI query, 408 response on timeout

**Out of scope:**
- AI Assistant frontend (Task 025)
- External LLM provider integration — this task uses a mock/simulated LLM response that can be swapped to OpenAI/Anthropic/Ollama via config
- Vector database (Meilisearch, Typesense, Pinecone) — this is an upgrade path noted in the docs

## Relevant data model

### DocumentText (for extracted text)
| Field | Type | Notes |
|-------|------|-------|
| id | bigint, auto | PK |
| documentId | bigint | FK unique to documents |
| content | longtext | Extracted text for FTS |
| timestamps | | |

FULLTEXT index on `(content)` already created in Task 002.

## Relevant API contract

### `POST /api/ai/query`
**Auth:** Required, **Roles:** All
**Request:** `{ query, conversationHistory?: [{ role, content }] }`
**Response 200 (can answer):** `{ data: { canAnswer: true, answer, citations: [{ id, documentId, title, author, division, fileType, page }], followUpPrompts: [] } }`
**Response 200 (cannot answer):** `{ data: { canAnswer: false, answer: "The library does not contain enough information to answer this.", citations: [], followUpPrompts: ["Browse the library", "Try different terms"] } }`
**Response 408:** `{ message: "The assistant took too long to respond. Please try again." }`

## Architectural conventions that apply

- `AiRetrievalInterface` is the contract — `query(string $query, array $conversationHistory): AiQueryResult`
- AiQueryResult is a read-only DTO/value object
- Retrieval is MySQL FTS via `MATCH AGAINST` on `document_texts.content` with boolean mode
- Re-ranking: boost score based on recency (newer = higher), division match, document type
- Top-N (default 5) results passed to LLM for synthesis
- LLM call is abstracted behind a service that can be swapped
- Indexing is queued (never synchronous): `IndexDocumentForAi` job dispatched on `Queue::PUSH` (high priority)
- Text extraction uses: `smalot/pdfparser` for PDF, `PhpOffice/PhpWord` for DOCX, `PhpOffice/PhpSpreadsheet` for XLSX
- Privacy boundary: ONLY published documents (`documents.published = true`) are searchable
- 30-second timeout on AI query endpoint (configurable)
- Honesty rules enforced programmatically: if zero relevant documents found, return `canAnswer: false`

## Step-by-step implementation checklist

- [ ] Install PHP libraries: `composer require smalot/pdfparser phpoffice/phpword phpoffice/phpspreadsheet`
- [ ] Create `app/Services/AiAssistantService.php` implementing `AiRetrievalInterface`:
  - `query()` method:
    1. MySQL FTS on `document_texts` JOIN `documents WHERE published = true`
    2. Use `MATCH(content) AGAINST(? IN BOOLEAN MODE)` for full-text search
    3. Apply re-ranking: boost by recency (points for documents < 1 year old), division match (if query contains division name), document type match
    4. Take top 5 results
    5. Pass to LLM simulator (or real LLM if configured) for answer synthesis
    6. Return `AiQueryResult`
- [ ] Create `app/Contracts/AiQueryResult.php` (or use a readonly DTO):
  - Properties: `canAnswer`, `answer`, `citations` array, `followUpPrompts`
- [ ] Create stub/simulated LLM service `app/Services/LlmService.php`:
  - For v1: return a mock answer using a template that references matched documents
  - Structure: inject matched document titles/authors into a canned response with citation markers
  - This allows frontend development to proceed before real LLM integration
- [ ] Create `app/Jobs/IndexDocumentForAi.php`:
  - Receive Document model
  - Resolve file from storage via FileStorageInterface
  - Extract text content using appropriate parser based on mimeType:
    - PDF: `Smalot\PdfParser\Parser`
    - DOCX: `PhpOffice\PhpWord\IOFactory`
    - XLSX: `PhpOffice\PhpSpreadsheet\IOFactory`
    - Others: skip (not indexable)
  - Store extracted text in `DocumentText` table (upsert: update if exists)
  - On empty extraction (e.g., scanned PDF): store empty content, mark as indexed
- [ ] Create or update `app/Listeners/IndexPublishedDocumentForAi.php`:
  - Handle `DocumentPublished` event
  - Dispatch `IndexDocumentForAi` job
- [ ] Update `app/Providers/EventServiceProvider` to register listener
- [ ] Create `app/Http/Requests/AiQueryRequest.php` — validates query (required, string, max 1000 chars), conversationHistory (optional array)
- [ ] Create `app/Http/Controllers/Api/AiController.php` with method `query`:
  - Validate request
  - Call `AiRetrievalInterface::query()`
  - If response time exceeds 30 seconds, return 408
  - Return AiQueryResult as camelCase JSON
  - Include honest-limits banner text in every response (as part of answer, or as separate `banner` field)
- [ ] Register route: `POST /api/ai/query` with `auth:sanctum` middleware
- [ ] Ensure `document_texts` table has FULLTEXT index on `(content)` (from Task 002)
- [ ] Write tests: index document text, FTS retrieval returns relevant documents, query endpoint returns structured response, non-published documents excluded, timeout handling, empty library response

## Definition of done

- `DocumentPublished` event triggers queued indexing job
- `IndexDocumentForAi` extracts text from PDF/DOCX/XLSX and stores in `document_texts`
- `POST /api/ai/query` returns structured response with `canAnswer`, `answer`, `citations`, `followUpPrompts`
- FTS retrieval only searches published documents
- Response includes honest-limits banner text
- No relevant documents → `canAnswer: false` with appropriate message
- Timeout (>30s) → 408 response
- Citations include documentId, title, author, division, fileType
- All responses use camelCase JSON keys
- Mock/workable answer is returned even without a real LLM API key
- Queue worker processes the indexing job

## Open questions / assumptions inherited

- **MySQL FTS for v1:** Adequate for hundreds to low thousands of documents. Can be swapped for vector store behind `AiRetrievalInterface` if volume exceeds ~10,000 or FTS relevance proves inadequate during pilot. Per `09-open-questions-and-assumptions.md` and `06-ai-assistant.md`.
- **LLM provider not decided:** This task uses a mock/simulated LLM. The `AiRetrievalInterface` contract allows swapping to OpenAI, Anthropic, or Ollama later. Decision should be made during pilot per `09-open-questions-and-assumptions.md`.
- **Text extraction** for scanned PDFs will yield empty content — the document will not be FTS-searchable. OCR is not implemented for v1.
