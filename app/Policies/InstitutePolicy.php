<?php

namespace App\Policies;

use App\Models\User;

class InstitutePolicy
{
    public function view(User $user): bool
    {
        return $user->isManagement();
    }
}
