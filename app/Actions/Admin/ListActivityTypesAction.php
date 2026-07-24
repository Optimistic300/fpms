<?php

namespace App\Actions\Admin;

use App\Models\ActivityType;
use Illuminate\Database\Eloquent\Collection;

class ListActivityTypesAction
{
    public function execute(): Collection
    {
        return ActivityType::orderBy('name')->get();
    }
}
