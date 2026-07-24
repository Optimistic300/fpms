<?php

namespace App\Policies;

use App\Models\User;

class AdminPolicy
{
    public function manageUsers(User $user): bool
    {
        return $user->isAdmin();
    }

    public function manageSettings(User $user): bool
    {
        return $user->isAdmin();
    }
}
