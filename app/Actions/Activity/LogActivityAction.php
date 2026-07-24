<?php

namespace App\Actions\Activity;

use App\Events\ActivityLogged;
use App\Models\Activity;
use App\Models\Project;
use App\Policies\ProjectPolicy;
use Illuminate\Support\Facades\DB;

class LogActivityAction
{
    public function execute(array $data, int $userId): Activity
    {
        return DB::transaction(function () use ($data, $userId) {
            $activity = Activity::create([
                'project_id' => $data['project_id'],
                'user_id' => $userId,
                'date' => $data['date'],
                'type' => $data['type'],
                'description' => $data['description'],
                'notes' => $data['notes'] ?? null,
            ]);

            $project = Project::findOrFail($data['project_id']);
            app(ProjectPolicy::class)->manageActivities(auth()->user(), $project);

            ActivityLogged::dispatch($activity);

            return $activity;
        });
    }
}
