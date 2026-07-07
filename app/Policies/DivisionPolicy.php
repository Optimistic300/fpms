<?php

namespace App\Policies;

use App\Models\User;

class DivisionPolicy
{
    public function view(User $user): bool
    {
        return in_array($user->role, ['DIVISION_HEAD', 'MANAGEMENT']);
    }
}
