<?php

namespace App\Services;

use App\Contracts\AiQueryResult;
use App\Contracts\AiRetrievalInterface;
use App\Exceptions\LlmUnavailable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class PgVectorAiRetrievalService implements AiRetrievalInterface
{
    public function __construct(
        private GeminiClient $llmClient,
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
            \Illuminate\Support\Facades\Log::channel('stderr')->error(
                $e->getMessage(),
                ['exception' => get_class($e), 'trace' => $e->getTraceAsString()]
            );
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
        $vector = '[' . implode(',', $this->llmClient->embed($query)) . ']';

        $rows = DB::select(
            "SELECT d.id as document_id,
                    string_agg(dc.content, ' ' ORDER BY dc.chunk_index) as content,
                    d.filename, d.type, u.full_name as author_name, dv.name as division_name,
                    de.embedding as embedding
             FROM document_embeddings de
             JOIN documents d ON d.id = de.document_id
             JOIN document_chunks dc ON dc.document_id = d.id
             LEFT JOIN users u ON u.id = d.uploaded_by
             LEFT JOIN projects p ON p.id = d.project_id
             LEFT JOIN divisions dv ON dv.id = p.division_id
             WHERE d.published = true
             GROUP BY d.id, d.filename, d.type, u.full_name, dv.name, de.embedding
             ORDER BY de.embedding <=> ?::vector
             LIMIT 6",
            [$vector]
        );

        return collect($rows)->map(fn ($row) => (object) [
            'document_id' => $row->document_id,
            'content' => $row->content,
            'page_number' => null,
            'locator' => null,
            'document' => (object) [
                'title' => $row->filename,
                'author_name' => $row->author_name,
                'division' => $row->division_name,
                'type' => $row->type,
            ],
        ]);
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