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

        // Determine database type and use appropriate search method
        $driverName = DB::getDriverName();
        
        if ($driverName === 'pgsql') {
            // Use PostgreSQL full-text search for now
            // TODO: Implement pgvector search when embeddings are available
            $rows = $this->searchWithPostgreSQLFullText($searchTerms);
        } else {
            // Default to MySQL FULLTEXT search
            $rows = $this->searchWithMySQLFullText($searchTerms);
        }

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
                $document = $documents[$row->document_id];

                // Calculate boost factors
                $recencyBoost = $this->calculateRecencyBoost($document->updated_at);
                $divisionBoost = $this->calculateDivisionBoost($document, $conversationHistory);

                // Combine relevance with boosts
                $finalScore = (float) $row->relevance * $recencyBoost * $divisionBoost;

                return [
                    'document' => $document,
                    'content' => $row->content,
                    'score' => $finalScore,
                    'page' => $this->estimatePageNumber($row->content, $query),
                ];
            })
            ->sortByDesc('score')
            ->take(5)
            ->values();

        // Build citations
        $citations = $rankedResults->map(function ($result) {
            return [
                'document_id' => $result['document']->id,
                'title' => $result['document']->filename,
                'excerpt' => $this->extractExcerpt($result['content'], $query),
                'page' => $result['page'],
                'score' => round($result['score'], 4),
            ];
        });

        // Prepare context for LLM
        $context = $rankedResults->map(function ($result) {
            return sprintf(
                'Document: %s\nExcerpt: %s\n',
                $result['document']->filename,
                $result['content']
            );
        })->implode('\n\n');

        // Get answer from LLM
        $answer = $this->llmService->generateAnswer($query, $context, $conversationHistory);

        return new AiQueryResult(
            canAnswer: true,
            answer: $answer,
            citations: $citations->toArray(),
            followUpPrompts: $this->generateFollowUpPrompts($query, $citations),
        );
    }

    /**
     * Search using PostgreSQL full-text search
     */
    private function searchWithPostgreSQLFullText(string $searchTerms)
    {
        // Convert search terms to tsquery format (preserving the + and * from buildSearchTerms)
        // Remove the leading + and trailing * for each term, then join with &
        $cleanTerms = array_map(function($term) {
            return substr($term, 1, -1); // Remove + at start and * at end
        }, explode(' ', $searchTerms));
        
        $tsquery = implode(' & ', $cleanTerms);
        
        return DB::table('document_texts')
            ->select('document_texts.id', 'document_texts.document_id', 'document_texts.content')
            ->selectRaw("ts_rank_cd(to_tsvector('english', document_texts.content), plainto_tsquery('english', ?)) as relevance", [$searchTerms])
            ->join('documents', 'documents.id', '=', 'document_texts.document_id')
            ->where('documents.published', true)
            ->whereRaw("to_tsvector('english', document_texts.content) @@ plainto_tsquery('english', ?)", [$searchTerms])
            ->orderBy('relevance', 'desc')
            ->limit(10)
            ->get();
    }

    /**
     * Search using PostgreSQL pgvector (placeholder for future implementation)
     */
    private function searchWithPgVector(string $searchTerms)
    {
        // For now, fall back to MySQL search to maintain functionality
        // TODO: Implement actual pgvector search when embeddings are available
        return $this->searchWithMySQLFullText($searchTerms);
    }

    private function calculateRecencyBoost($updatedAt): float
    {
        if (!$updatedAt) {
            return 1.0;
        }

        $now = now();
        $diffInDays = $now->diffInDays($updatedAt);
        
        // Boost documents updated within the last year
        if ($diffInDays < 365) {
            return 2.0;
        }
        
        // Slight boost for recent documents
        if ($diffInDays < 730) { // 2 years
            return 1.5;
        }
        
        return 1.0;
    }

    private function calculateDivisionBoost(Document $document, array $conversationHistory): float
    {
        $divisionName = $document->project?->division?->name ?? '';
        if (!$divisionName || empty($conversationHistory)) {
            return 1.0;
        }

        // Check if division name appears in conversation history
        foreach ($conversationHistory as $message) {
            if (isset($message['content']) && 
                str_contains(Str::lower($message['content']), Str::lower($divisionName))) {
                return 1.5; // Boost if division was mentioned in conversation
            }
        }

        return 1.0;
    }

    private function estimatePageNumber(string $content, string $query): int
    {
        // Simple estimation: assume ~500 words per page
        $wordCount = str_word_count($content);
        $estimatedPages = max(1, ceil($wordCount / 500));
        
        // For now, return page 1 as we don't have precise location info
        // In a real implementation, we'd store page numbers with chunks
        return 1;
    }

    private function extractExcerpt(string $content, string $query): string
    {
        // Find the first occurrence of any query term and return surrounding text
        $cleanedQuery = preg_replace('/[+\-><\(\)~*\"@]+/', ' ', $query);
        $words = array_filter(explode(' ', $cleanedQuery));
        
        $position = 0;
        foreach ($words as $word) {
            $word = trim($word);
            if (strlen($word) < 2) {
                continue;
            }
            
            $position = stripos($content, $word);
            if ($position !== false) {
                break;
            }
        }
        
        if ($position === false) {
            // If no terms found, return beginning of content
            $position = 0;
        }
        
        // Extract ~200 characters around the match
        $start = max(0, $position - 100);
        $length = 200;
        
        $excerpt = substr($content, $start, $length);
        
        // Add ellipsis if we're not at the boundaries
        if ($start > 0) {
            $excerpt = '...' . $excerpt;
        }
        
        if ($start + $length < strlen($content)) {
            $excerpt = $excerpt . '...';
        }
        
        return $excerpt;
    }

    private function generateFollowUpPrompts(string $query, array $citations): array
    {
        $prompts = [
            'Browse the library',
            'Try different terms',
        ];
        
        if (count($citations) > 0) {
            // Extract unique divisions from citations
            $divisions = array_unique(array_filter(array_map(function($citation) {
                return $citation['division'] ?? '';
            }, $citations)));
            
            if (!empty($divisions)) {
                $prompts[] = 'Show me more from ' . $divisions[0];
            }
            
            $prompts[] = 'Which divisions have published most on this topic?';
            $prompts[] = 'Show me the full reports';
        }
        
        return $prompts;
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