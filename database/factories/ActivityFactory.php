<?php

namespace Database\Factories;

use App\Models\Activity;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ActivityFactory extends Factory
{
    protected $model = Activity::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'user_id' => User::factory(),
            'date' => fake()->date(),
            'type' => fake()->word(),
            'description' => fake()->sentence(),
            'notes' => fake()->optional()->paragraph(),
        ];
    }
}
