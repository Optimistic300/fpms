<?php

namespace App\Actions\Admin;

use App\Models\ActivityType;

class DeleteActivityTypeAction
{
    public function execute(ActivityType $activityType): void
    {
        $activityType->delete();
    }
}
