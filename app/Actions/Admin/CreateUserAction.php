<?php

namespace App\Actions\Admin;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class CreateUserAction
{
    public function execute(array $data): User
    {
        return User::create([
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'full_name' => $data['full_name'],
            'avatar_initials' => strtoupper(substr($data['full_name'], 0, 2)),
            'role' => $data['role'],
            'division_id' => $data['division_id'] ?? null,
            'is_active' => true,
        ]);
    }
}
