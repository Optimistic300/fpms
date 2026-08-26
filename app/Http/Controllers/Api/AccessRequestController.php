<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateAccessRequestRequest;
use App\Http\Resources\AccessRequestResource;
use App\Models\AccessRequest;
use Illuminate\Http\JsonResponse;

class AccessRequestController extends Controller
{
    public function update(UpdateAccessRequestRequest $request, AccessRequest $accessRequest): JsonResponse
    {
        $this->authorize('update', $accessRequest);

        $accessRequest->update([
            'status' => $request->validated()['status'],
        ]);

        return response()->json([
            'data' => new AccessRequestResource($accessRequest->fresh()),
        ]);
    }
}
