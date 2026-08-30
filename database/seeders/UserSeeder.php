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
                'division_name' => 'Biodiversity Conservation and Ecosystem Services',
            ],
            [
                'full_name' => 'James Adeyemi',
                'email' => 'researcher@forig.org',
                'password' => 'password',
                'role' => 'RESEARCHER',
                'division_name' => 'Biodiversity Conservation and Ecosystem Services',
            ],
            [
                'full_name' => 'Chioma Nwosu',
                'email' => 'student@forig.org',
                'password' => 'password',
                'role' => 'STUDENT',
                'division_name' => 'Forest and Climate Change',
            ],
            [
                'full_name' => 'Amina Bello',
                'email' => 'secretary@forig.org',
                'password' => 'password',
                'role' => 'SECRETARY',
                'division_name' => 'Forest Policy, Governance and Livelihoods',
            ],
            [
                'full_name' => 'Dr. Emmanuel Obi',
                'email' => 'division_head@forig.org',
                'password' => 'password',
                'role' => 'DIVISION_HEAD',
                'division_name' => 'Wood Industry and Utilisation',
            ],
            [
                'full_name' => 'Prof. Ibrahim Musa',
                'email' => 'management@forig.org',
                'password' => 'password',
                'role' => 'MANAGEMENT',
                'division_name' => 'Forest Improvement and Productivity',
            ],
        ];

        foreach ($users as $userData) {
            $division = Division::where('name', $userData['division_name'])->first();

            $words = explode(' ', $userData['full_name']);
            $initials = '';
            foreach ($words as $word) {
                $initials .= strtoupper(mb_substr($word, 0, 1));
            }

            User::firstOrCreate(
                ['email' => $userData['email']],
                [
                    'full_name' => $userData['full_name'],
                    'password' => Hash::make($userData['password']),
                    'role' => $userData['role'],
                    'division_id' => $division->id,
                    'is_active' => true,
                    'avatar_initials' => mb_substr($initials, 0, 4),
                ]
            );
        }
    }
}
