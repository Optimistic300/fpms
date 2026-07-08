<?php

namespace App\Services;

use App\Contracts\AiQueryResult;
use App\Contracts\AiRetrievalInterface;
use App\Models\Document;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AiAssistantService implements AiRetrievalInterface
{
    public function __construct(
        private LlmService $llmService,
    ) {}

    public function query(string $query, array $conversationHistory = []): AiQueryResult
    {
        $searchTerms = $this->buildSearchTerms($query);

        $rows = DB::table('document_texts')
            ->select('document_texts.id', 'document_texts.document_id', 'document_texts.content')
            ->selectRaw("MATCH(document_texts.content) AGAINST(? IN BOOLEAN MODE) as relevance", [$searchTerms])
            ->join('documents', 'documents.id', '=', 'document_texts.document_id')
            ->where('documents.published', true)
            ->whereRaw("MATCH(document_texts.content) AGAINST(? IN BOOLEAN MODE)", [$searchTerms])
            ->orderBy('relevance', 'desc')
            ->limit(10)
            ->get();

        if ($rows->isEmpty()) {
            return new AiQueryResult(
                canAnswer: false,
                answer: 'The library does not contain enough information to answer this.',
                citations: [],
                followUpPrompts: ['Browse the library', 'Try different terms'],
            );
        }

        $documentIds = $rows->pluck('document_id');
        $documents = Document::with(['uploader', 'project.division'])
            ->whereIn('id', $documentIds)
            ->get()
            ->keyBy('id');

        $rankedResults = $rows
            ->map(function ($row) use ($documents, $query) {
                $doc = $documents->get($row->document_id);
                if (!$doc) {
                    return null;
                }

                $score = (float) $row->relevance;

                if ($doc->created_at && $doc->created_at->gt(now()->subYear())) {
                    $score += 2.0;
                }

                $divisionName = $doc->project?->division?->name ?? '';
                if ($divisionName && str_contains(Str::lower($query), Str::lower($divisionName))) {
                    $score += 1.0;
                }

                return [
                    'score' => $score,
                    'document' => $doc,
                    'snippet' => Str::limit($row->content, 500),
                ];
            })
            ->filter()
            ->sortByDesc('score')
            ->take(5)
            ->values()
            ->all();

        return $this->llmService->synthesize($query, $rankedResults);
    }

    private function buildSearchTerms(string $query): string
    {
        $cleaned = preg_replace('/[+\-><\(\)~*\"@]+/', ' ', $query);
        $words = array_filter(explode(' ', $cleaned));
        $terms = [];

        foreach ($words as $word) {
            $word = trim($word);
            if (strlen($word) < 2) {
                continue;
            }
            $terms[] = '+' . $word . '*';
        }

        return implode(' ', $terms);
    }
}
