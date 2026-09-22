<?php

namespace App\Http\Controllers;

use App\Events\CommentAdded;
use App\Http\Resources\CommentResource;
use App\Models\Activity;
use App\Models\Document;
use App\Models\Project;
use App\Models\Publication;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function projectIndex(Request $request, Project $project): JsonResponse
    {
        return $this->index($request, $project);
    }

    public function projectStore(Request $request, Project $project): JsonResponse
    {
        return $this->store($request, $project);
    }

    public function activityIndex(Request $request, Activity $activity): JsonResponse
    {
        return $this->index($request, $activity);
    }

    public function activityStore(Request $request, Activity $activity): JsonResponse
    {
        return $this->store($request, $activity);
    }

    public function documentIndex(Request $request, Document $document): JsonResponse
    {
        return $this->index($request, $document);
    }

    public function documentStore(Request $request, Document $document): JsonResponse
    {
        return $this->store($request, $document);
    }

    public function publicationIndex(Request $request, Publication $publication): JsonResponse
    {
        return $this->index($request, $publication);
    }

    public function publicationStore(Request $request, Publication $publication): JsonResponse
    {
        return $this->store($request, $publication);
    }

    private function index(Request $request, Model $commentable): JsonResponse
    {
        $this->authorize('view', $commentable);

        $comments = $commentable->comments()->with('user')->orderBy('created_at')->get();

        return response()->json(['data' => CommentResource::collection($comments)]);
    }

    private function store(Request $request, Model $commentable): JsonResponse
    {
        $this->authorize('view', $commentable);

        $validated = $request->validate(['body' => 'required|string|max:5000']);

        $comment = $commentable->comments()->create([
            'user_id' => $request->user()->id,
            'body' => $validated['body'],
        ]);

        CommentAdded::dispatch($comment, $commentable, $request->user());

        return response()->json([
            'data' => (new CommentResource($comment->load('user')))->resolve($request),
        ], 201);
    }
}
