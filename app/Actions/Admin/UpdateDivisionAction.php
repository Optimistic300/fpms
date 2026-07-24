<?php

namespace App\Actions\Admin;

use App\Models\Division;

class UpdateDivisionAction
{
    public function execute(Division $division, array $data): Division
    {
        $division->update([
            'name' => $data['name'] ?? $division->name,
            'head_id' => array_key_exists('head_id', $data) ? $data['head_id'] : $division->head_id,
        ]);

        return $division->fresh()->load('head');
    }
}
