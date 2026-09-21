<?php

namespace App\Actions\Project;

use App\Models\Project;

class DeleteProjectAction
{
    public function execute(Project $project): void
    {
        // Cascades: project_members, activities, documents, reports, and
        // access_requests are all cascadeOnDelete() at the DB level.
        $project->delete();
    }
}
