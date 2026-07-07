<?php

namespace App\Actions\Library;

use App\Models\Document;
use Illuminate\Http\Request;

class DocumentsAction
{
    public function execute(Request $request): array
    {
        $query = Document::with(['project.division', 'uploader'])
            ->where('published', true);

        if ($request->filled('division')) {
            $query->whereHas('project', fn($q) => $q->where('division_id', $request->division));
        }

        if ($request->filled('documentType')) {
            $query->where('type', $request->documentType);
        }

        if ($request->filled('researchArea')) {
            $query->whereHas('project', fn($q) => $q->where('research_area', 'like', '%' . $request->researchArea . '%'));
        }

        if ($request->filled('q')) {
            $query->where('filename', 'like', '%' . $request->q . '%');
        }

        $limit = min((int) $request->input('limit', 15), 100);
        $docs = $query->orderBy('created_at', 'desc')->paginate($limit);

        return ['documents' => $docs];
    }
}
