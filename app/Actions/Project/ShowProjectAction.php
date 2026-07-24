<?php

namespace App\Actions\Project;

use App\Models\Project;

class ShowProjectAction
{
    public function execute(Project $project): Project
    {
        return $project->load(['division', 'lead', 'members.user']);
    }
}
