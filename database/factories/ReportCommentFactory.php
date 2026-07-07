<?php

namespace Database\Factories;

use App\Models\Report;
use App\Models\ReportComment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReportCommentFactory extends Factory
{
    protected $model = ReportComment::class;

    public function definition(): array
    {
        return [
            'report_id' => Report::factory(),
            'user_id' => User::factory(),
            'comment' => fake()->paragraph(),
        ];
    }
}
