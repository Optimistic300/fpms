<?php

namespace App\Services;

use App\Contracts\AiRetrievalInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class HybridSearchRetrieval implements AiRetrievalInterface
{
    protected HybridRetrieval $retrieval;

    public function __construct(HybridRetrieval $retrieval)
    {
        $this->retrieval = $retrieval;
    }

    public function query(string $query, array $conversationHistory = []): Collection
    {
        Log::info('HybridSearchRetrieval: Performing query', [
            'query' => $query,
            'conversationHistory_count' => count($conversationHistory),
        ]);

        $results = $this->retrieval->query($query, $conversationHistory);
        

        return $results instanceof Collection ? $results : collect($results);
    }
}