<?php

namespace Database\Factories;

use App\Models\InboxItem;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class InboxItemFactory extends Factory
{
    protected $model = InboxItem::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'sender_id' => null,
            'type' => fake()->randomElement(['DOCUMENT', 'REPORT_UPDATE', 'SYSTEM']),
            'subject' => fake()->sentence(),
            'message' => fake()->optional()->paragraph(),
            'document_id' => null,
            'report_id' => null,
            'read' => false,
        ];
    }
}
