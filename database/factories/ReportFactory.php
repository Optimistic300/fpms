<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\Report;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReportFactory extends Factory
{
    protected $model = Report::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'submitted_by' => User::factory(),
            'type' => fake()->randomElement(['QUARTERLY', 'MID_YEAR', 'ANNUAL']),
            'period_start' => fake()->date(),
            'period_end' => fake()->date(),
            'narrative_summary' => fake()->paragraph(),
            'file_path' => null,
            'status' => fake()->randomElement(['DRAFT', 'PENDING', 'RETURNED', 'APPROVED', 'ESCALATED']),
            'parent_report_id' => null,
            'version' => 1,
            'comment' => null,
            'reviewed_by' => null,
            'submitted_at' => null,
        ];
    }
}
