<?php

namespace App\Policies;

use App\Models\AccessRequest;
use App\Models\User;

class AccessRequestPolicy
{
    public function update(User $user, AccessRequest $accessRequest): bool
    {
        $project = $accessRequest->project;

        if (!$project) {
            return false;
        }

        return $project->lead_researcher_id === $user->id;
    }
}
