<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\Publication;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PublicationFactory extends Factory
{
    protected $model = Publication::class;

    public function definition(): array
    {
        return [
            'title' => fake()->sentence(6),
            'authors' => fake()->name() . ', ' . fake()->name(),
            'type' => fake()->randomElement(['PAPER', 'THESIS', 'REPORT', 'STUDENT']),
            'status' => fake()->randomElement(['DRAFT', 'SUBMITTED', 'IN_REVISION', 'PUBLISHED']),
            'journal_name' => fake()->optional()->company(),
            'linked_project_id' => null,
            'doi' => null,
            'manuscript_file_path' => null,
            'submitted_by_id' => User::factory(),
            'student_name' => null,
            'supervisor' => null,
            'degree_programme' => null,
            'submission_date' => null,
            'revision_due_date' => null,
        ];
    }
}
