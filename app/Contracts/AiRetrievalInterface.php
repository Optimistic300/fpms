<?php

namespace App\Contracts;

use Illuminate\Support\Collection;

/**
 * Interface for AI retrieval operations.
 * 
 * This interface defines the contract for retrieving relevant document chunks
 * based on a query, optionally using conversation history for context.
 */
interface AiRetrievalInterface
{
    /**
     * Retrieve relevant document chunks for a query.
     * 
     * @param string $query The user's query text
     * @param array<int, array{role: string, content: string}> $conversationHistory Optional conversation history
     * @return Collection of document chunks with metadata
     */
    public function query(string $query, array $conversationHistory): Collection;
}