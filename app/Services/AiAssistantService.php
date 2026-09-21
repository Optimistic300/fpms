<?php

namespace App\Services;

use App\Contracts\AiRetrievalInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AiAssistantService implements AiRetrievalInterface
{
    public function query(string $query, array $conversationHistory = []): Collection
    {
        $searchTerms = $this->buildSearchTerms($query);

        if ($searchTerms === '') {
            return collect();
        }

        $driverName = DB::getDriverName();

        $baseQuery = DB::table('document_texts as dt')
            ->join('documents as d', 'd.id', '=', 'dt.document_id')
            ->where('d.published', true)
            ->select('dt.id', 'dt.document_id', 'dt.content', 'd.title', 'd.author_name', 'd.type as file_type', 'd.created_at', 'd.updated_at');

        if ($driverName === 'pgsql') {
            $baseQuery
                ->selectRaw("ts_rank_cd(to_tsvector('english', dt.content), plainto_tsquery('english', ?)) as relevance", [$searchTerms])
                ->whereRaw("to_tsvector('english', dt.content) @@ plainto_tsquery('english', ?)", [$searchTerms]);
        } else {
            $baseQuery
                ->selectRaw("MATCH(dt.content) AGAINST(? IN BOOLEAN MODE) as relevance", [$searchTerms])
                ->whereRaw("MATCH(dt.content) AGAINST(? IN BOOLEAN MODE)", [$searchTerms]);
        }

        return $baseQuery
            ->orderByDesc('relevance')
            ->limit(10)
            ->get();
    }

    private function buildSearchTerms(string $query): string
    {
        $cleaned = preg_replace('/[+\-><\(\)~*\"@]+/', ' ', $query);
        $words = array_filter(array_map('trim', preg_split('/\s+/', (string) $cleaned)));
        $terms = [];

        foreach ($words as $word) {
            if (mb_strlen($word) < 2) {
                continue;
            }

            $terms[] = '+' . $word . '*';
        }

        return implode(' ', $terms);
    }
}