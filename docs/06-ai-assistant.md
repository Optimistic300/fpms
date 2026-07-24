# AI Assistant — "Ask SKMS" Deep-Dive

## Overview

The AI Assistant is a retrieval-augmented generation (RAG) system that answers plain-language questions from FORIG's own published library documents. It is the most technically distinct feature in SKMS because it requires a retrieval mechanism beyond simple MySQL queries.

## Retrieval Mechanism

### Decision: MySQL Full-Text Search + Application-Layer Re-Ranking

MySQL has no native vector/semantic search. For v1, the retrieval pipeline is:

1. **MySQL Full-Text Search (FTS)** — Published documents are indexed using MySQL's `FULLTEXT` index on `documents.filename` and a document content/metadata text column. This supports boolean search modes and relevance scoring.

2. **Re-ranking step** — Application code (a queued Job) computes a simple relevance score boost based on recency, division match, and document type. Top-N results are passed to the language model for synthesis.

**Why not a vector database for v1:**
- The library document volume at FORIG scale (hundreds to low thousands of documents) does not warrant a separate vector infrastructure.
- MySQL FTS with re-ranking is sufficient for keyword-accurate retrieval.
- An external vector store (Meilisearch, Typesense, Pinecone) can be added behind the `AiRetrievalInterface` contract in a future version without changing any calling code.

**This is a named open question.** If document volume significantly exceeds expectations (>10,000 documents) or if FTS relevance proves inadequate in user testing, the retrieval backend should be swapped for a vector-capable store. See `09-open-questions-and-assumptions.md`.

### Interface

```php
interface AiRetrievalInterface {
    public function query(string $query, array $conversationHistory): AiQueryResult;
}
```

`AiQueryResult` contains:
- `canAnswer: bool`
- `answer: string` (with citation markers `[1]`, `[2]`, etc.)
- `citations: array` (each: `{ documentId, title, author, division, fileType, page }`)
- `followUpPrompts: array`

## Honesty Rules (Non-Negotiable)

| Rule | Implementation |
|------|---------------|
| Always cite sources | Every claim in the answer text must have a corresponding citation marker referencing a real document in the response's `citations` array. |
| Never guess | If retrieved documents do not contain sufficient information to answer the query, return `canAnswer: false` with the message "The library does not contain enough information to answer this." |
| Honest-limits banner | Every response (including `canAnswer: false`) includes the non-dismissible banner: "This answer draws only from FORIG's own library. It is not a literature review. For published external research use Google Scholar or Web of Science." |
| No internet fallback | The assistant does not fall back to internet search. It draws only on FORIG's stored documents. |

## API Contract

### `POST /api/ai/query`

**Request:**
```json
{
  "query": "What has FORIG found about carbon sequestration?",
  "conversationHistory": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response (can answer):**
```json
{
  "data": {
    "canAnswer": true,
    "answer": "FORIG has conducted research... [1]... [2]...",
    "citations": [
      {
        "id": 1,
        "documentId": 42,
        "title": "Carbon Sequestration in Cocoa Agroforests",
        "author": "Yaa Asantewaa",
        "division": "Forest Ecology",
        "fileType": "REPORT",
        "page": 12
      }
    ],
    "followUpPrompts": ["Which divisions have published most on this topic?"]
  }
}
```

**Response (cannot answer):**
```json
{
  "data": {
    "canAnswer": false,
    "answer": "The library does not contain enough information to answer this.",
    "citations": [],
    "followUpPrompts": ["Browse the library", "Try different terms"]
  }
}
```

## Indexing Pipeline

When a document is published to the library, it must be indexed for AI retrieval. This is handled by a chain:

1. **Event:** `DocumentPublished` is fired by the publish action.
2. **Listener:** `IndexPublishedDocumentForAi` handles the event.
3. **Job:** `IndexDocumentForAi` is dispatched to the queue.
4. The Job extracts text content from the document file (PDF, DOCX, or XLSX — using a PHP text extraction library), stores it in a `document_contents` table or metadata column, and updates the MySQL `FULLTEXT` index.

**This must be queued, never synchronous.** The publish request returns immediately; indexing happens asynchronously.

## Citation Model

Citations use numbered markers `[1]`, `[2]` placed inline in the answer text where the corresponding claim appears. The order follows the order documents are cited in the generated answer.

Each citation in the `citations` array must include:
- `id` — sequential number matching the `[1]` markers
- `documentId` — FK to the `documents` table
- `title` — document title
- `author` — uploading user's name
- `division` — the document's division
- `fileType` — document type
- `page` — approximate page number (where applicable)

Clicking a citation card calls `GET /api/documents/:id/preview` to open the document in an inline viewer.

## Privacy Boundary

The AI assistant searches only **published** library documents (where `documents.published = true`). Unpublished documents (project-internal documents) are never included in the retrieval corpus. This is enforced at the backend retrieval layer, not just in the frontend UI.

## Offline Behaviour

The AI assistant requires an internet connection to perform retrieval and synthesis. When offline:
- The gold button is still visible but shows a subtle offline indicator.
- Clicking it shows a message: "Ask SKMS requires an internet connection. Your questions will be saved and answered when you reconnect."
- Users can type questions and they will be queued for submission when connectivity returns.

## Future Considerations

- **Vector search:** If document volume grows, swap `AiRetrievalInterface` implementation to use Meilisearch, Typesense, Pinecone, or pgvector.
- **LLM provider:** The current design abstracts the LLM behind `AiRetrievalInterface`. The provider (OpenAI, Anthropic, local model) can be swapped via config.
- **Real-time streaming:** v1 returns a complete response. Future versions could stream tokens for faster perceived response time.
