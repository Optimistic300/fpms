<?php

namespace App\Actions\Admin;

use App\Models\Division;

class CreateDivisionAction
{
    public function execute(array $data): Division
    {
        return Division::create([
            'name' => $data['name'],
            'head_id' => $data['head_id'] ?? null,
        ]);
    }
}
