<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateAccessRequestRequest;
use App\Http\Resources\AccessRequestResource;
use App\Models\AccessRequest;
use App\Policies\ProjectPolicy;
use Illuminate\Http\JsonResponse;

class AccessRequestController extends Controller
{
    public function update(UpdateAccessRequestRequest $request, AccessRequest $accessRequest): JsonResponse
    {
        $project = $accessRequest->project;
        $policy = app(ProjectPolicy::class);

        if (!$policy->manageAccessRequests($request->user(), $project)) {
            abort(403, 'This action is unauthorized.');
        }

        $accessRequest->update([
            'status' => $request->validated()['status'],
        ]);

        return response()->json([
            'data' => new AccessRequestResource($accessRequest->fresh()),
        ]);
    }
}
