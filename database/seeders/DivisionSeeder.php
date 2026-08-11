<?php

namespace Database\Seeders;

use App\Models\Division;
use Illuminate\Database\Seeder;

class DivisionSeeder extends Seeder
{
    public function run(): void
    {
        $divisions = [
            'Biodiversity Conservation and Ecosystem Services',
            'Forest Improvement and Productivity',
            'Forest and Climate Change',
            'Forest Economics and Marketing Division',
            'Forest Policy, Governance and Livelihoods',
            'Wood Industry and Utilisation',
            'Commercialisation',
            'Administration',
            'Finance',
            'Information and Communication Section',
            'Grants and Projects Office',
        ];

        foreach ($divisions as $name) {
            Division::firstOrCreate(['name' => $name]);
        }
    }
}
