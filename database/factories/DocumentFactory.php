<?php

namespace Database\Factories;

use App\Models\Document;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class DocumentFactory extends Factory
{
    protected $model = Document::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'activity_id' => null,
            'uploaded_by' => User::factory(),
            'filename' => fake()->word() . '.' . fake()->fileExtension(),
            'file_path' => 'documents/' . fake()->uuid() . '.' . fake()->fileExtension(),
            'mime_type' => fake()->mimeType(),
            'size' => fake()->numberBetween(1024, 10485760),
            'type' => fake()->randomElement(['DATA_SHEET', 'PHOTO', 'MAP', 'RECEIPT', 'REPORT', 'MANUSCRIPT', 'OTHER']),
            'published' => fake()->boolean(20),
        ];
    }
}
