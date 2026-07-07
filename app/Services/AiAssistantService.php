<?php

namespace App\Services;

use App\Contracts\AiQueryResult;
use App\Contracts\AiRetrievalInterface;

class AiAssistantService implements AiRetrievalInterface
{
    public function query(string $query, array $conversationHistory = []): AiQueryResult
    {
        throw new \RuntimeException('AiAssistantService::query() not yet implemented');
    }
}
