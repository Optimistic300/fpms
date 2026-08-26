<?php

namespace Database\Seeders;

use App\Models\Division;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'full_name' => 'Dr. Sarah Okonkwo',
                'email' => 'admin@forig.org',
                'password' => 'password',
                'role' => 'ADMIN',
                'division_name' => 'Forest Ecology',
            ],
            [
                'full_name' => 'James Adeyemi',
                'email' => 'researcher@forig.org',
                'password' => 'password',
                'role' => 'RESEARCHER',
                'division_name' => 'Forest Ecology',
            ],
            [
                'full_name' => 'Chioma Nwosu',
                'email' => 'student@forig.org',
                'password' => 'password',
                'role' => 'STUDENT',
                'division_name' => 'Climate Change',
            ],
            [
                'full_name' => 'Amina Bello',
                'email' => 'secretary@forig.org',
                'password' => 'password',
                'role' => 'SECRETARY',
                'division_name' => 'Social Science',
            ],
            [
                'full_name' => 'Dr. Emmanuel Obi',
                'email' => 'division_head@forig.org',
                'password' => 'password',
                'role' => 'DIVISION_HEAD',
                'division_name' => 'Forest Products and Utilisation',
            ],
            [
                'full_name' => 'Prof. Ibrahim Musa',
                'email' => 'management@forig.org',
                'password' => 'password',
                'role' => 'MANAGEMENT',
                'division_name' => 'Forest Genetics and Tree Improvement',
            ],
        ];

        foreach ($users as $userData) {
            $division = Division::where('name', $userData['division_name'])->first();

            User::create([
                'full_name' => $userData['full_name'],
                'email' => $userData['email'],
                'password' => Hash::make($userData['password']),
                'role' => $userData['role'],
                'division_id' => $division->id,
                'is_active' => true,
            ]);
        }
    }
}
