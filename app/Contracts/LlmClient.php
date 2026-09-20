<?php

namespace App\Contracts;

use Illuminate\Support\Collection;

/**
 * Contract for LLM clients used in the AI assistant.
 * This allows swapping between different LLM providers (OpenAI, Anthropic, local models).
 */
interface LlmClient
{
    /**
     * Rewrite a query using conversation history to create a standalone search query.
     *
     * @param string $query The original user query
     * @param array<int, array{role: string, content: string}> $history Conversation history
     * @return string Standalone query suitable for search
     * @throws LlmUnavailable on timeout / provider error / malformed output
     */
    public function rewriteQuery(string $query, array $history): string;

    /**
     * Synthesize an answer from the query and retrieved chunks.
     *
     * @param string $query The search query
     * @param Collection $chunks Retrieved document chunks
     * @return array{canAnswer: bool, answer: string, quotes: array<string,string>, followUps: string[]}
     * @throws LlmUnavailable on timeout / provider error / malformed output
     */
    public function synthesise(string $query, Collection $chunks): array;
}