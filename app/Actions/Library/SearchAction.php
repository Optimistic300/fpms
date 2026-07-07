<?php

namespace App\Actions\Library;

use App\Models\Document;
use Illuminate\Http\Request;

class SearchAction
{
    public function execute(Request $request): array
    {
        $q = $request->q;

        $documents = Document::where('published', true)
            ->where(function ($query) use ($q) {
                $query->where('filename', 'like', "%{$q}%")
                    ->orWhereHas('project', fn($pq) => $pq->where('title', 'like', "%{$q}%")
                        ->orWhere('research_area', 'like', "%{$q}%"));
            })
            ->with(['project.division', 'uploader'])
            ->limit(20)
            ->get()
            ->map(fn($doc) => $this->formatResult($doc, $q));

        return [
            'documents' => $documents,
            'total' => $documents->count(),
        ];
    }

    private function formatResult($doc, string $query): array
    {
        $snippet = $doc->filename;

        $searchIn = [$doc->filename];
        if ($doc->project) {
            $searchIn[] = $doc->project->title;
        }

        foreach ($searchIn as $text) {
            if (stripos($text, $query) !== false) {
                $snippet = preg_replace(
                    '/(' . preg_quote($query, '/') . ')/i',
                    '<mark>$1</mark>',
                    e($text)
                );
                break;
            }
        }

        return [
            'id' => $doc->id,
            'title' => $doc->filename,
            'type' => $doc->type,
            'snippet' => $snippet,
            'division' => $doc->project?->division?->name,
            'author' => $doc->uploader?->full_name,
            'date' => $doc->created_at?->toDateString(),
            'documentType' => $doc->type,
        ];
    }
}
