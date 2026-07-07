<?php

namespace App\Policies;

use App\Models\Activity;
use App\Models\User;

class ActivityPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Activity $activity): bool
    {
        return $user->id === $activity->user_id
            || app(ProjectPolicy::class)->hasAccess($user, $activity->project);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['RESEARCHER', 'STUDENT', 'DIVISION_HEAD']);
    }

    public function update(User $user, Activity $activity): bool
    {
        return $user->id === $activity->user_id;
    }

    public function delete(User $user, Activity $activity): bool
    {
        return $user->id === $activity->user_id;
    }
}
