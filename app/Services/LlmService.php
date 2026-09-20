<?php

namespace App\Services;

use App\Contracts\AiQueryResult;
use App\Contracts\LlmClient;
use App\Exceptions\LlmUnavailable;
use App\Models\Document;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class LlmService implements LlmClient
{
    public function synthesize(string $query, Collection $chunks): array
    {
        if ($chunks->isEmpty()) {
            return [
                'canAnswer' => false,
                'answer' => 'The library does not contain enough information to answer this.',
                'quotes' => [],
                'followUps' => ['Browse the library', 'Try different terms'],
            ];
        }

        $quotes = [];
        $lines = [];
        $followUpPrompts = [];

        foreach ($chunks as $i => $chunk) {
            $num = $i + 1;
            $doc = $chunk->document;
            $content = $chunk->content;

            // Extract a relevant snippet (first 200 chars for now)
            $snippet = Str::limit($content, 200);

            $lines[] = sprintf(
                'Document "%s" by %s [%d] discusses: %s',
                $doc->title,
                $doc->author_name ?? 'Unknown',
                $num,
                $snippet,
            );

            $quotes[(string) $num] = $snippet;
        }

        if (count($quotes) > 0) {
            $followUpPrompts[] = 'Which divisions have published most on this topic?';
            $followUpPrompts[] = 'Show me the full reports';
        }

        $followUpPrompts[] = 'Browse the library';
        $followUpPrompts[] = 'Try different terms';

        $answer = 'Based on the library documents, here is what I found:' . "\n\n";
        $answer .= implode("\n\n", $lines);

        return [
            'canAnswer' => true,
            'answer' => $answer,
            'quotes' => $quotes,
            'followUps' => array_unique($followUpPrompts),
        ];
    }

    public function rewriteQuery(string $query, array $history): string
    {
        // If no history, return the original query
        if (empty($history)) {
            return $query;
        }

        // Take the last few messages from history
        $recentHistory = array_slice($history, -3); // Last 3 messages

        // Build context from history
        $contextParts = [];
        foreach ($recentHistory as $message) {
            $role = ucfirst($message['role']);
            $content = $message['content'];
            $contextParts[] = "$role: $content";
        }

        $context = implode("\n", $contextParts);

        // For now, we'll just return the original query with context appended
        // In a real implementation, this would call an LLM to rewrite the query
        if (!empty($context)) {
            return $query . "\n\nContext from previous conversation:\n" . $context;
        }

        return $query;
    }
}
