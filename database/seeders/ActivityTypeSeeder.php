<?php

namespace Database\Seeders;

use App\Models\ActivityType;
use Illuminate\Database\Seeder;

class ActivityTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['name' => 'Field data collection', 'slug' => 'field-data-collection'],
            ['name' => 'Lab work / sample analysis', 'slug' => 'lab-work-sample-analysis'],
            ['name' => 'Community engagement', 'slug' => 'community-engagement'],
            ['name' => 'Stakeholder meeting', 'slug' => 'stakeholder-meeting'],
            ['name' => 'Literature review', 'slug' => 'literature-review'],
            ['name' => 'Training / workshop', 'slug' => 'training-workshop'],
            ['name' => 'Equipment maintenance', 'slug' => 'equipment-maintenance'],
            ['name' => 'Administrative', 'slug' => 'administrative'],
        ];

        foreach ($types as $type) {
            ActivityType::firstOrCreate(['slug' => $type['slug']], $type);
        }
    }
}
