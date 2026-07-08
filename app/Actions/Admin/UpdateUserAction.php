<?php

namespace App\Actions\Admin;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UpdateUserAction
{
    public function execute(User $user, array $data): User
    {
        $update = [];

        if (isset($data['email'])) {
            $update['email'] = $data['email'];
        }

        if (isset($data['full_name'])) {
            $update['full_name'] = $data['full_name'];
            $update['avatar_initials'] = strtoupper(substr($data['full_name'], 0, 2));
        }

        if (isset($data['role'])) {
            $update['role'] = $data['role'];
        }

        if (array_key_exists('division_id', $data)) {
            $update['division_id'] = $data['division_id'];
        }

        if (isset($data['is_active'])) {
            $update['is_active'] = $data['is_active'];
        }

        if (isset($data['password'])) {
            $update['password'] = Hash::make($data['password']);
        }

        $user->update($update);

        return $user->fresh()->load('division');
    }
}
