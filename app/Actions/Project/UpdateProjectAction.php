<?php

namespace App\Actions\Project;

use App\Models\Project;

class UpdateProjectAction
{
    public function execute(Project $project, array $data): Project
    {
        $update = [];
        if (array_key_exists('title', $data)) $update['title'] = $data['title'];
        if (array_key_exists('description', $data)) $update['description'] = $data['description'];
        if (array_key_exists('funding_type', $data)) $update['funding_type'] = $data['funding_type'];
        if (array_key_exists('funding_source', $data)) $update['funding_source'] = $data['funding_source'];
        if (array_key_exists('research_area', $data)) $update['research_area'] = $data['research_area'];
        if (array_key_exists('location', $data)) $update['location'] = $data['location'];
        if (array_key_exists('start_date', $data)) $update['start_date'] = $data['start_date'];
        if (array_key_exists('end_date', $data)) $update['end_date'] = $data['end_date'];
        if (array_key_exists('status', $data)) $update['status'] = $data['status'];
        if (array_key_exists('progress', $data)) $update['progress'] = $data['progress'];

        if (!empty($update)) {
            $project->update($update);
        }

        return $project->fresh();
    }
}
