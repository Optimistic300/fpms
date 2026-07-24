<?php

namespace App\Http\Controllers;

use App\Actions\Document\DeleteDocumentAction;
use App\Actions\Document\DownloadDocumentAction;
use App\Actions\Document\ListDocumentsAction;
use App\Actions\Document\PreviewDocumentAction;
use App\Actions\Document\UpdateDocumentAction;
use App\Http\Requests\UpdateDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Activity;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Document::class, 'document');
    }

    public function index(Request $request, ListDocumentsAction $action): JsonResponse
    {
        $result = $action->execute($request);

        return response()->json([
            'data' => DocumentResource::collection($result['documents']),
            'meta' => [
                'currentPage' => $result['documents']->currentPage(),
                'lastPage' => $result['documents']->lastPage(),
                'perPage' => $result['documents']->perPage(),
                'total' => $result['documents']->total(),
            ],
        ]);
    }

    public function uploadToActivity(Request $request, Activity $activity): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png,gif,doc,docx,xls,xlsx,csv,zip|max:25600',
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

    public function update(UpdateDocumentRequest $request, Document $document, UpdateDocumentAction $action): JsonResponse
    {
        $document = $action->execute($document, $request->validated());

        return response()->json([
            'data' => ['id' => $document->id, 'published' => $document->published],
            'message' => $document->published ? 'Document published to library.' : 'Document updated.',
        ]);
    }

    public function download(Request $request, Document $document, DownloadDocumentAction $action)
    {
        if (!$document->published) {
            $this->authorize('download', $document);
        }

        return $action->execute($document);
    }

    public function preview(Request $request, Document $document, PreviewDocumentAction $action): JsonResponse
    {
        if (!$document->published) {
            $this->authorize('download', $document);
        }

        $data = $action->execute($document);

        return response()->json(['data' => $data]);
    }

    public function destroy(Request $request, Document $document, DeleteDocumentAction $action): JsonResponse
    {
        $action->execute($document);

        return response()->json(['message' => 'Document removed.']);
    }
}
