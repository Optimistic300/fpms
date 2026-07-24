<?php

namespace App\Actions\Document;

use App\Models\Document;
use Illuminate\Http\Request;

class ListDocumentsAction
{
    public function execute(Request $request): array
    {
        $query = Document::with(['project', 'uploader']);

        if ($request->filled('projectId')) {
            $query->where('project_id', $request->projectId);
        }

        if ($request->has('published')) {
            $query->where('published', $request->boolean('published'));
        }

        $limit = min((int) $request->input('limit', 15), 100);
        $documents = $query->orderBy('created_at', 'desc')->paginate($limit);

        return ['documents' => $documents];
    }
}
