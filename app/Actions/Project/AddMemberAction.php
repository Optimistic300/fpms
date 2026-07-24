<?php

namespace App\Actions\Project;

use App\Events\ProjectMemberAdded;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;

class AddMemberAction
{
    public function execute(Project $project, string $email, string $role): array
    {
        $user = User::where('email', $email)->firstOrFail();

        $existing = ProjectMember::where('project_id', $project->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existing) {
            abort(422, 'User is already a member of this project.');
        }

        $member = ProjectMember::create([
            'project_id' => $project->id,
            'user_id' => $user->id,
            'role' => $role,
        ]);

        ProjectMemberAdded::dispatch($project, $user, $role);

        return [
            'userId' => $user->id,
            'fullName' => $user->full_name,
            'role' => $role,
        ];
    }
}
