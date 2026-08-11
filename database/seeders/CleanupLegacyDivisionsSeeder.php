<?php

namespace Database\Seeders;

use App\Models\Division;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Seeder;

class CleanupLegacyDivisionsSeeder extends Seeder
{
    /**
     * Placeholder division names seeded before the real CSIR-FORIG division
     * list was known. Anything still pointing at these gets moved to the
     * fallback division below, then these rows are deleted.
     */
    private const LEGACY_NAMES = [
        'Forest Ecology',
        'Climate Change',
        'Social Science',
        'Forest Products and Utilisation',
        'Forest Genetics and Tree Improvement',
        'Plant Health and Quarantine',
    ];

    private const FALLBACK_NAME = 'Administration';

    public function run(): void
    {
        $legacyDivisions = Division::whereIn('name', self::LEGACY_NAMES)->get();

        if ($legacyDivisions->isEmpty()) {
            return;
        }

        $fallback = Division::where('name', self::FALLBACK_NAME)->first();

        if (! $fallback) {
            $this->command?->warn(
                'Fallback division "'.self::FALLBACK_NAME.'" not found - run DivisionSeeder first. Skipping cleanup.'
            );

            return;
        }

        $legacyIds = $legacyDivisions->pluck('id');

        User::whereIn('division_id', $legacyIds)->update(['division_id' => $fallback->id]);
        Project::whereIn('division_id', $legacyIds)->update(['division_id' => $fallback->id]);

        Division::whereIn('id', $legacyIds)->delete();
    }
}
