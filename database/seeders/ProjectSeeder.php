<?php

namespace Database\Seeders;

use App\Models\Project;
use Illuminate\Database\Seeder;

class ProjectSeeder extends Seeder
{
    public function run(): void
    {
        // Create sample projects for researcher
        Project::factory()->count(5)->create([
            'lead_researcher_id' => 2, // James Adeyemi (researcher@forig.org)
            'status' => 'ACTIVE',
        ]);

        Project::factory()->count(3)->create([
            'lead_researcher_id' => 2, // James Adeyemi (researcher@forig.org)
            'status' => 'PROPOSED',
        ]);

        Project::factory()->count(2)->create([
            'lead_researcher_id' => 2, // James Adeyemi (researcher@forig.org)
            'status' => 'COMPLETED',
        ]);

        Project::factory()->count(1)->create([
            'lead_researcher_id' => 2, // James Adeyemi (researcher@forig.org)
            'status' => 'ARCHIVED',
        ]);
    }
}