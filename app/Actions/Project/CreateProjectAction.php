<?php

namespace App\Actions\Project;

use App\Models\Project;
use App\Models\ProjectMember;
use Illuminate\Support\Facades\DB;

class CreateProjectAction
{
    public function execute(array $data, int $userId): Project
    {
        return DB::transaction(function () use ($data, $userId) {
            $project = Project::create([
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'division_id' => $data['division_id'],
                'lead_researcher_id' => $userId,
                'funding_type' => $data['funding_type'],
                'funding_source' => $data['funding_source'] ?? null,
                'research_area' => $data['research_area'] ?? null,
                'location' => $data['location'] ?? null,
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'] ?? null,
                'status' => 'PROPOSED',
                'progress' => 0,
            ]);

            ProjectMember::create([
                'project_id' => $project->id,
                'user_id' => $userId,
                'role' => 'LEAD',
            ]);

            return $project;
        });
    }
}
