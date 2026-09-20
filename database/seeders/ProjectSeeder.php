<?php

namespace Database\Seeders;

use App\Models\Division;
use App\Models\Project;
use Illuminate\Database\Seeder;

class ProjectSeeder extends Seeder
{
    public function run(): void
    {
        // Idempotent: skip if this researcher already has sample projects,
        // since this runs on every deploy/cold-start via db:seed --force.
        if (Project::where('lead_researcher_id', 2)->exists()) {
            return;
        }

        // ProjectFactory's default division_id falls back to Division::factory(),
        // which invents a random fake-company-named division - use James
        // Adeyemi's real division (set in UserSeeder) instead, so these sample
        // projects don't pollute the real CSIR-FORIG division list.
        $divisionId = Division::where('name', 'Biodiversity Conservation and Ecosystem Services')->value('id');

        // Create sample projects for researcher
        Project::factory()->count(5)->create([
            'lead_researcher_id' => 2, // James Adeyemi (researcher@forig.org)
            'division_id' => $divisionId,
            'status' => 'ACTIVE',
        ]);

        Project::factory()->count(3)->create([
            'lead_researcher_id' => 2, // James Adeyemi (researcher@forig.org)
            'division_id' => $divisionId,
            'status' => 'PROPOSED',
        ]);

        Project::factory()->count(2)->create([
            'lead_researcher_id' => 2, // James Adeyemi (researcher@forig.org)
            'division_id' => $divisionId,
            'status' => 'COMPLETED',
        ]);

        Project::factory()->count(1)->create([
            'lead_researcher_id' => 2, // James Adeyemi (researcher@forig.org)
            'division_id' => $divisionId,
            'status' => 'ARCHIVED',
        ]);
    }
}