<?php

namespace App\Services;

use App\Contracts\EmbedderInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Hybrid retrieval service that combines keyword and vector search.
 * 
 * This service implements the retrieval logic as specified in the AI Assistant documentation,
 * using the database schema and columns added in the v3 spec.
 */
class HybridRetrieval
{
    /**
     * The embedder service.
     */
    protected EmbedderInterface $embedder;

    /**
     * Constructor.
     */
    public function __construct(EmbedderInterface $embedder)
    {
        $this->embedder = $embedder;
    }

    /**
     * Perform a hybrid search query.
     * 
     * @param string $query The user's query text
     * @param array<string,string> $conversationHistory Optional history for query rewriting (not used in passages mode)
     * @return Collection of document chunks with scores and metadata
     */
    public function query(string $query, array $conversationHistory = []): Collection
    {
        // In passages mode, we ignore conversation history for query rewriting
        // as per the v3 spec (history is only used in generative mode for query rewrite)
        $standaloneQuery = $query;

        // Get the query embedding
        $queryEmbedding = $this->embedder->embedQuery($standaloneQuery);

        // Get configuration values
        $minKeywordRank = config('ai.min_keyword_rank', 0.1);
        $minCosineSimilarity = config('ai.min_cosine_similarity', 0.4); // equivalent to max_distance
        $topN = config('ai.top_n', 6);
        $perArmLimit = config('ai.per_arm_limit', 20); // Number to retrieve from each arm before combining
        $currentEmbeddingModel = $this->embedder->modelId();

        // Format the query embedding as a PostgreSQL vector literal
        $queryEmbeddingLiteral = '[' . implode(',', $queryEmbedding) . ']';

        // Execute the hybrid search SQL
        $results = DB::select("
            WITH keyword_scores AS (
                SELECT
                    dc.id AS chunk_id,
                    ts_rank_cd(dc.tsv, query) AS keyword_rank
                FROM document_chunks dc
                JOIN documents d ON dc.document_id = d.id
                CROSS JOIN plainto_tsquery('english', ?) AS query
                WHERE
                    d.published = true
                    AND d.allow_external_ai = true
                    AND dc.tsv @@ query
                    AND ts_rank_cd(dc.tsv, query) >= ?
                    AND dc.embedding_model = ?
                ORDER BY keyword_rank DESC
                LIMIT ?
            ),
            vector_scores AS (
                SELECT
                    dc.id AS chunk_id,
                    1 - (dc.embedding <=> ?::vector) AS vector_similarity
                FROM document_chunks dc
                JOIN documents d ON dc.document_id = d.id
                WHERE
                    d.published = true
                    AND d.allow_external_ai = true
                    AND 1 - (dc.embedding <=> ?::vector) >= ?
                    AND dc.embedding_model = ?
                ORDER BY vector_similarity DESC
                LIMIT ?
            ),
            combined AS (
                SELECT
                    COALESCE(k.chunk_id, v.chunk_id) AS chunk_id,
                    COALESCE(k.keyword_rank, 0) + COALESCE(v.vector_similarity, 0) AS combined_score
                FROM keyword_scores k
                FULL OUTER JOIN vector_scores v ON k.chunk_id = v.chunk_id
            )
            SELECT 
    dc.*,
    d.filename AS title,
    d.filename,
    d.type AS file_type,
    d.mime_type,
    d.project_id,
    dc.page_number,
    dc.locator,
    c.combined_score
FROM combined c
JOIN document_chunks dc ON c.chunk_id = dc.id
JOIN documents d ON dc.document_id = d.id
WHERE d.published = true
  AND d.allow_external_ai = true
ORDER BY c.combined_score DESC
LIMIT ?;
        ", [
            $standaloneQuery,
            $minKeywordRank,
            $currentEmbeddingModel,
            $perArmLimit,

            $queryEmbeddingLiteral, $queryEmbeddingLiteral, $minCosineSimilarity, $currentEmbeddingModel, $perArmLimit,

            $topN
        ]);

        // Convert to collection
        return collect($results);
    }
}