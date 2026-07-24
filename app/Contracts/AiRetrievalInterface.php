<?php

namespace App\Contracts;

interface AiRetrievalInterface
{
    public function query(string $query, array $conversationHistory = []): AiQueryResult;
}
