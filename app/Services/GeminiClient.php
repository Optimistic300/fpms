<?php

namespace App\Services;

use App\Contracts\LlmClient;
use App\Exceptions\LlmUnavailable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;

class GeminiClient implements LlmClient
{
    private string $apiKey;
    private string $embeddingModel;
    private string $generationModel;

    public function __construct()
    {
        $this->apiKey = (string) env('GEMINI_API_KEY');
        $this->embeddingModel = (string) env('GEMINI_EMBEDDING_MODEL', 'gemini-embedding-2');
        $this->generationModel = (string) env('GEMINI_MODEL', 'gemini-2.5-flash');
    }

    public function embed(string $text): array
    {
        $res = Http::timeout(20)->post(
            "https://generativelanguage.googleapis.com/v1beta/models/{$this->embeddingModel}:embedContent?key={$this->apiKey}",
            [
                'content' => ['parts' => [['text' => $text]]],
                'outputDimensionality' => 1536,
            ]
        );

        if (!$res->successful()) {
            throw new LlmUnavailable('Embedding provider error: ' . $res->status());
        }

        $vector = $res->json('embedding.values');

        if (!is_array($vector) || empty($vector)) {
            throw new LlmUnavailable('Embedding provider returned no vector.');
        }

        return $vector;
    }

    public function rewriteQuery(string $query, array $history): string
    {
        return $query;
    }

    public function synthesise(string $query, Collection $chunks): array
    {
        $context = $chunks->values()->map(function ($chunk, $i) {
            $n = $i + 1;
            return "[{$n}] \"{$chunk->document->title}\": " . str($chunk->content)->limit(800);
        })->implode("\n\n");

        $prompt = <<<PROMPT
You are FPMS's research library assistant. Answer the question using ONLY the numbered
sources below. Cite sources inline like [1], [2]. If the sources don't answer the
question, say so plainly instead of guessing.

Sources:
{$context}

Question: {$query}

Respond with a concise answer using [n] citation markers.
PROMPT;

        $res = Http::timeout(30)->post(
            "https://generativelanguage.googleapis.com/v1beta/models/{$this->generationModel}:generateContent?key={$this->apiKey}",
            ['contents' => [['parts' => [['text' => $prompt]]]]]
        );

        if (!$res->successful()) {
            throw new LlmUnavailable('LLM provider error: ' . $res->status());
        }

        $answer = $res->json('candidates.0.content.parts.0.text');

        if (!$answer) {
            throw new LlmUnavailable('LLM provider returned an empty answer.');
        }

        $quotes = [];
        foreach ($chunks->values() as $i => $chunk) {
            $quotes[(string) ($i + 1)] = str($chunk->content)->limit(200)->toString();
        }

        return [
            'canAnswer' => true,
            'answer' => trim($answer),
            'quotes' => $quotes,
            'followUps' => ['Show me the full documents', 'Browse the library'],
        ];
    }
}
