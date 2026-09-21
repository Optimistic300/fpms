<?php

namespace App\Contracts;

use Illuminate\Support\Collection;

interface AiRetrievalInterface
{
    /**
     * Perform a semantic search or other AI query.
     *
     * @param string $query
     * @param array<int, array{role: string, content: string}> $conversationHistory
     * @return Collection
     */
    public function query(string $query, array $conversationHistory = []): Collection;
}