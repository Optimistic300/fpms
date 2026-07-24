<?php

namespace App\Http\Controllers;

use App\Actions\Publication\CreatePublicationAction;
use App\Actions\Publication\UpdatePublicationAction;
use App\Http\Requests\StorePublicationRequest;
use App\Http\Requests\UpdatePublicationRequest;
use App\Http\Resources\PublicationResource;
use App\Models\Publication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicationController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Publication::class, 'publication');
    }

    public function index(Request $request): JsonResponse
    {
        $query = Publication::with(['submitter', 'linkedProject']);

        if ($request->filled('submittedBy')) {
            $query->where('submitted_by_id', $request->submittedBy);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $limit = min((int) $request->integer('limit', 20), 100);
        $publications = $query->orderBy('created_at', 'desc')->paginate($limit);

        return response()->json(
            PublicationResource::paginated($publications, PublicationResource::collection($publications))
        );
    }

    public function pipeline(): JsonResponse
    {
        return response()->json([
            'data' => [
                'draft' => Publication::where('status', 'DRAFT')->count(),
                'submitted' => Publication::where('status', 'SUBMITTED')->count(),
                'inRevision' => Publication::where('status', 'IN_REVISION')->count(),
                'published' => Publication::where('status', 'PUBLISHED')->count(),
            ],
        ]);
    }

    public function store(StorePublicationRequest $request, CreatePublicationAction $action): JsonResponse
    {
        $publication = $action->execute($request->validated());

        $publication->load(['submitter', 'linkedProject']);

        return response()->json([
            'data' => new PublicationResource($publication),
        ], 201);
    }

    public function show(Request $request, Publication $publication): JsonResponse
    {
        $publication->load(['submitter', 'linkedProject']);

        return response()->json([
            'data' => new PublicationResource($publication),
        ]);
    }

    public function update(UpdatePublicationRequest $request, UpdatePublicationAction $action, Publication $publication): JsonResponse
    {
        $publication = $action->execute($publication, $request->validated());

        $publication->load(['submitter', 'linkedProject']);

        return response()->json([
            'data' => new PublicationResource($publication),
        ]);
    }
}
