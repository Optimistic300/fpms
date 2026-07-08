<?php

namespace App\Actions\Admin;

use App\Models\ActivityType;

class CreateActivityTypeAction
{
    public function execute(array $data): ActivityType
    {
        return ActivityType::create([
            'name' => $data['name'],
            'slug' => $data['slug'],
        ]);
    }
}
