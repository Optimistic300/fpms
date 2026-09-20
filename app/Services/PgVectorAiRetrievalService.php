<?php

namespace App\Services;

use App\Contracts\AiQueryResult;
use App\Contracts\AiRetrievalInterface;
use App\Contracts\LlmClient;
use App\Exceptions\LlmUnavailable;
use App\Models\Document;
use App\Models\DocumentChunk;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PgVectorAiRetrievalService implements AiRetrievalInterface
{
    public function __construct(
        private LlmClient $llmClient,
    ) {}

    public function query(string $query, array $conversationHistory = []): AiQueryResult
    {
        try {
            // Step 1: Query rewrite using conversation history
            $standaloneQuery = $this->rewriteQuery($query, $conversationHistory);

            // Step 2: Hybrid retrieval using pgvector
            $chunks = $this->retrieve($standaloneQuery);

            if ($chunks->isEmpty()) {
                return new AiQueryResult(
                    canAnswer: false,
                    answer: 'The library does not contain enough information to answer this.',
                    citations: [],
                    followUpPrompts: ['Browse the library', 'Try different terms'],
                );
            }

            // Step 3: Synthesize answer using LLM
            $draft = $this->llmClient->synthesise($standaloneQuery, $chunks);

            if (!$draft['canAnswer']) {
                return new AiQueryResult(
                    canAnswer: false,
                    answer: 'The library does not contain enough information to answer this.',
                    citations: [],
                    followUpPrompts: ['Browse the library', 'Try different terms'],
                );
            }

            // Step 4: Verify citations and quotes
            $result = $this->verifyCitations($draft, $chunks);

            return $result ?? new AiQueryResult(
                canAnswer: false,
                answer: 'The library does not contain enough information to answer this.',
                citations: [],
                followUpPrompts: ['Browse the library', 'Try different terms'],
            );
        } catch (\Throwable $e) {
            // Log the error in a real implementation
            throw new LlmUnavailable('The assistant took too long to respond. Please try again.');
        }
    }

    private function rewriteQuery(string $query, array $conversationHistory): string
    {
        // Client-supplied history is untrusted: cap length, force valid roles.
        $history = collect($conversationHistory)
            ->filter(fn ($m) => in_array($m['role'] ?? null, ['user', 'assistant'], true))
            ->take(-config('ai.history_turns', 6))
            ->values()
            ->all();

        return $history 
            ? $this->llmClient->rewriteQuery($query, $history) 
            : $query;
    }

    private function retrieve(string $query): Collection
    {
        // Hybrid retrieval using pgvector
        return DocumentChunk::search($query, function ($index, $query, $opts) {
                $opts['filter'] = 'published = true'; // Layer 1: filter at index level
                $opts['limit'] = 20;
                $opts['rankingScoreThreshold'] = config('ai.min_score', 0.5);
                $opts['showRankingScore'] = true;
                $opts['hybrid'] = [
                    'embedder' => 'default',
                    'semanticRatio' => config('ai.semantic_ratio', 0.6)
                ];
                return $index->search($query, $opts);
            })
            ->query(fn ($eloquent) => $eloquent->with('document')
                ->whereHas('document', fn ($d) => $d->where('published', true))) // Layer 2: DB re-check
            ->get()
            // Apply light boost and diversification
            ->groupBy('document_id')
            ->flatMap(fn ($g) => $g->take(config('ai.max_chunks_per_doc', 2)))
            ->take(config('ai.top_n', 6))
            ->values();
    }

    private function verifyCitations(array $draft, Collection $chunks): ?AiQueryResult
    {
        // Extract all [N] markers from the answer
        preg_match_all('/\[(\d+)\]/', $draft['answer'], $matches);

        $used = collect($matches[1])
            ->map(fn ($n) => (int) $n)
            ->unique()
            ->filter(fn ($n) => $chunks->has($n - 1)) // Drop markers that don't correspond to retrieved chunks
            ->filter(fn ($n) => !config('ai.verify_quotes', true) 
                || $this->quoteAppears($draft['quotes'][(string) $n] ?? '', $chunks[$n - 1]->content))
            ->values();

        if ($used->isEmpty()) {
            return null; // No valid markers remain
        }

        // Renumber remaining markers by first appearance
        $renumber = $used->flip()->map(fn ($i) => $i + 1); // old => new index

        $answer = preg_replace_callback('/\[(\d+)\]/',
            fn ($x) => isset($renumber[(int) $x[1]]) 
                ? '[' . $renumber[(int) $x[1]] . ']' 
                : '',
            $draft['answer']);

        $citations = $used->map(function ($old, $i) use ($chunks, $draft) {
            $chunk = $chunks[$old - 1];
            return [
                'id' => $i + 1,
                'documentId' => $chunk->document_id,
                'title' => $chunk->document->title,
                'author' => $chunk->document->author_name,
                'division' => $chunk->document->division,
                'fileType' => $chunk->document->type,
                'page' => $chunk->page_number,
                'locator' => $chunk->locator,
                'snippet' => $draft['quotes'][(string) $old] ?? null,
            ];
        })->all();

        return new AiQueryResult(
            canAnswer: true,
            answer: trim($answer),
            citations: $citations,
            followUpPrompts: $draft['followUps'] ?? [],
        );
    }

    private function quoteAppears(string $quote, string $content): bool
    {
        $norm = fn ($s) => mb_strtolower(preg_replace('/\s+/u', ' ', trim($s)));
        return $quote !== '' && str_contains($norm($content), $norm($quote));
    }
}