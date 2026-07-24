<?php

namespace Database\Factories;

use App\Models\AccessRequest;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AccessRequestFactory extends Factory
{
    protected $model = AccessRequest::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'requester_id' => User::factory(),
            'status' => fake()->randomElement(['PENDING', 'GRANTED', 'DENIED']),
        ];
    }
}
