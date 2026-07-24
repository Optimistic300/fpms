<?php

namespace App\Policies;

use App\Models\Publication;
use App\Models\User;

class PublicationPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Publication $publication): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['RESEARCHER', 'STUDENT', 'DIVISION_HEAD']);
    }

    public function update(User $user, Publication $publication): bool
    {
        return $user->id === $publication->submitted_by_id;
    }

    public function delete(User $user, Publication $publication): bool
    {
        return $user->id === $publication->submitted_by_id || $user->isAdmin();
    }
}
