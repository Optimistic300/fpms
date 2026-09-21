<?php

namespace App\Services;

use App\Contracts\AiRetrievalInterface;
use App\Contracts\EmbedderInterface;
use Illuminate\Support\Collection;

/**
 * Hybrid search retrieval implementation.
 * 
 * This service implements the AiRetrievalInterface using the HybridRetrieval
 * service which combines keyword and vector search.
 */
class HybridSearchRetrieval implements AiRetrievalInterface
{
    /**
     * The hybrid retrieval service.
     */
    protected HybridRetrieval $retrieval;

    /**
     * Constructor.
     */
    public function __construct(HybridRetrieval $retrieval)
    {
        $this->retrieval = $retrieval;
    }

    /**
     * Retrieve relevant document chunks for a query.
     * 
     * @param string $query The user's query text
     * @param array<int, array{role: string, content: string}> $conversationHistory Optional conversation history
     * @return Collection of document chunks with metadata
     */
    public function query(string $query, array $conversationHistory): Collection
    {
        return $this->retrieval->query($query, $conversationHistory);
    }
}