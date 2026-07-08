<?php

namespace Database\Factories;

use App\Models\Document;
use App\Models\DocumentText;
use Illuminate\Database\Eloquent\Factories\Factory;

class DocumentTextFactory extends Factory
{
    protected $model = DocumentText::class;

    public function definition(): array
    {
        return [
            'document_id' => Document::factory(),
            'content' => fake()->paragraphs(5, true),
        ];
    }
}
