<?php

namespace Database\Factories;

use App\Models\Division;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProjectFactory extends Factory
{
    protected $model = Project::class;

    public function definition(): array
    {
        return [
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'division_id' => Division::factory(),
            'lead_researcher_id' => User::factory(),
            'funding_type' => fake()->randomElement(['DONOR', 'GOVERNMENT', 'INTERNAL']),
            'funding_source' => fake()->optional()->company(),
            'research_area' => fake()->optional()->word(),
            'location' => fake()->optional()->city(),
            'start_date' => fake()->date(),
            'end_date' => fake()->optional()->date(),
            'status' => fake()->randomElement(['PROPOSED', 'ACTIVE', 'COMPLETED', 'ARCHIVED']),
            'progress' => fake()->numberBetween(0, 100),
        ];
    }
}
