<?php

namespace App\Actions\Project;

use App\Events\AccessRequestCreated;
use App\Models\AccessRequest;
use App\Models\Project;

class RequestAccessAction
{
    public function execute(Project $project, int $requesterId): AccessRequest
    {
        $existing = AccessRequest::where('project_id', $project->id)
            ->where('requester_id', $requesterId)
            ->where('status', 'PENDING')
            ->first();

        if ($existing) {
            abort(422, 'You already have a pending access request.');
        }

        $accessRequest = AccessRequest::create([
            'project_id' => $project->id,
            'requester_id' => $requesterId,
            'status' => 'PENDING',
        ]);

        AccessRequestCreated::dispatch($accessRequest);

        return $accessRequest;
    }
}
