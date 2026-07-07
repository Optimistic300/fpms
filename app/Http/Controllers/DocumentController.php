<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Policies\ProjectPolicy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Document::class, 'document');
    }

    public function index(Request $request): JsonResponse
    {
        $query = Document::with(['project', 'uploader']);

        if ($request->filled('projectId')) {
            $query->where('project_id', $request->projectId);
        }

        if ($request->has('published')) {
            $query->where('published', $request->boolean('published'));
        }

        $limit = min((int) $request->limit, 100);
        $documents = $query->orderBy('created_at', 'desc')->paginate($limit);

        $documents->getCollection()->transform(function ($doc) {
            return [
                'id' => $doc->id,
                'projectId' => $doc->project_id,
                'filename' => $doc->filename,
                'mimeType' => $doc->mime_type,
                'size' => $doc->size,
                'type' => $doc->type,
                'published' => $doc->published,
                'uploadedBy' => $doc->uploader?->full_name,
                'createdAt' => $doc->created_at?->toIso8601String(),
            ];
        });

        return response()->json([
            'data' => $documents->items(),
            'meta' => [
                'currentPage' => $documents->currentPage(),
                'lastPage' => $documents->lastPage(),
                'perPage' => $documents->perPage(),
                'total' => $documents->total(),
            ],
        ]);
    }

    public function uploadToActivity(Request $request, \App\Models\Activity $activity): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:25600',
            'type' => 'required|in:DATA_SHEET,PHOTO,MAP,RECEIPT,REPORT,MANUSCRIPT,OTHER',
        ]);

        $file = $request->file('file');
        $path = $file->store('documents');

        $doc = Document::create([
            'project_id' => $activity->project_id,
            'activity_id' => $activity->id,
            'uploaded_by' => $request->user()->id,
            'filename' => $file->getClientOriginalName(),
            'file_path' => $path,
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'type' => $request->type,
            'published' => false,
        ]);

        return response()->json([
            'data' => ['id' => $doc->id, 'filename' => $doc->filename, 'size' => $doc->size],
            'message' => 'File uploaded.',
        ], 201);
    }

    public function update(Request $request, Document $document): JsonResponse
    {
        $validated = $request->validate([
            'published' => 'sometimes|boolean',
        ]);

        if (isset($validated['published'])) {
            $document->update(['published' => $validated['published']]);
        }

        return response()->json([
            'data' => ['id' => $document->id, 'published' => $document->published],
            'message' => $validated['published'] ? 'Document published to library.' : 'Document updated.',
        ]);
    }

    public function download(Request $request, Document $document): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        if (!$document->published) {
            $this->authorize('download', $document);
        }

        if (!Storage::disk('local')->exists($document->file_path)) {
            abort(404, 'File not found.');
        }

        return Storage::disk('local')->download($document->file_path, $document->filename);
    }

    public function preview(Request $request, Document $document): JsonResponse
    {
        if (!$document->published) {
            $this->authorize('download', $document);
        }

        $previewUrl = Storage::disk('local')->url($document->file_path);
        $inlineSupported = in_array($document->mime_type, [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
        ]);

        return response()->json([
            'data' => [
                'id' => $document->id,
                'filename' => $document->filename,
                'mimeType' => $document->mime_type,
                'previewUrl' => $previewUrl,
                'inlinePreviewSupported' => $inlineSupported,
            ],
        ]);
    }

    public function destroy(Request $request, Document $document): JsonResponse
    {
        Storage::disk('local')->delete($document->file_path);
        $document->delete();

        return response()->json([
            'message' => 'Document removed.',
        ]);
    }
}
