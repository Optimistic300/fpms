<?php

namespace App\Actions\Admin;

use App\Models\Division;
use Illuminate\Database\Eloquent\Collection;

class ListDivisionsAction
{
    public function execute(): Collection
    {
        return Division::with('head')->orderBy('name')->get();
    }
}
