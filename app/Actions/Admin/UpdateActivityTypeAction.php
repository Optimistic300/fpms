<?php

namespace App\Actions\Admin;

use App\Models\ActivityType;

class UpdateActivityTypeAction
{
    public function execute(ActivityType $activityType, array $data): ActivityType
    {
        $activityType->update([
            'name' => $data['name'] ?? $activityType->name,
            'slug' => $data['slug'] ?? $activityType->slug,
        ]);

        return $activityType->fresh();
    }
}
