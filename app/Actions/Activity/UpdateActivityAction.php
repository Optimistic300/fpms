<?php

namespace App\Actions\Activity;

use App\Models\Activity;

class UpdateActivityAction
{
    public function execute(Activity $activity, array $data): Activity
    {
        $fillable = [];
        if (array_key_exists('date', $data)) {
            $fillable['date'] = $data['date'];
        }
        if (array_key_exists('type', $data)) {
            $fillable['type'] = $data['type'];
        }
        if (array_key_exists('description', $data)) {
            $fillable['description'] = $data['description'];
        }
        if (array_key_exists('notes', $data)) {
            $fillable['notes'] = $data['notes'];
        }

        $activity->update($fillable);

        return $activity->fresh()->load('documents');
    }
}
