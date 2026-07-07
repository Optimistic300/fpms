<?php

namespace Database\Seeders;

use App\Models\Division;
use Illuminate\Database\Seeder;

class DivisionSeeder extends Seeder
{
    public function run(): void
    {
        $divisions = [
            'Forest Ecology',
            'Climate Change',
            'Social Science',
            'Forest Products and Utilisation',
            'Forest Genetics and Tree Improvement',
            'Plant Health and Quarantine',
        ];

        foreach ($divisions as $name) {
            Division::create(['name' => $name]);
        }
    }
}
