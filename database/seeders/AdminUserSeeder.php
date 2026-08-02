<?php

namespace Database\Seeders;

use App\Models\Division;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('ADMIN_EMAIL');
        $password = env('ADMIN_PASSWORD');

        if (! $email || ! $password) {
            return;
        }

        if (User::where('email', $email)->exists()) {
            return;
        }

        $division = Division::first();

        if (! $division) {
            return;
        }

        User::create([
            'full_name' => env('ADMIN_NAME', 'Admin'),
            'email' => $email,
            'password' => $password,
            'role' => 'ADMIN',
            'division_id' => $division->id,
            'is_active' => true,
            'avatar_initials' => 'AD',
        ]);
    }
}
