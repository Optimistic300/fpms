<?php

namespace App\Services;

use App\Contracts\AiQueryResult;
use App\Models\Document;
use Illuminate\Support\Str;

class LlmService
{
    public function synthesize(string $query, array $rankedResults): AiQueryResult
    {
        if (empty($rankedResults)) {
            return new AiQueryResult(
                canAnswer: false,
                answer: 'The library does not contain enough information to answer this.',
                citations: [],
                followUpPrompts: ['Browse the library', 'Try different terms'],
            );
        }

        $citations = [];
        $lines = [];
        $followUpPrompts = [];

        foreach ($rankedResults as $i => $item) {
            $num = $i + 1;
            $doc = $item['document'];
            $snippet = $item['snippet'];

            $lines[] = sprintf(
                'Document "%s" by %s [%d] discusses: %s',
                $doc->filename,
                $doc->uploader?->full_name ?? 'Unknown',
                $num,
                Str::limit($snippet, 200),
            );

            $citations[] = [
                'id' => $num,
                'documentId' => $doc->id,
                'title' => $doc->filename,
                'author' => $doc->uploader?->full_name ?? 'Unknown',
                'division' => $doc->project?->division?->name ?? '',
                'fileType' => $doc->type,
                'page' => null,
            ];
        }

        if (count($citations) > 0) {
            $followUpPrompts[] = 'Which divisions have published most on this topic?';
            $followUpPrompts[] = 'Show me the full reports';
        }

        $followUpPrompts[] = 'Browse the library';
        $followUpPrompts[] = 'Try different terms';

        $answer = 'Based on the library documents, here is what I found:' . "\n\n";
        $answer .= implode("\n\n", $lines);

        return new AiQueryResult(
            canAnswer: true,
            answer: $answer,
            citations: $citations,
            followUpPrompts: array_unique($followUpPrompts),
        );
    }
}
