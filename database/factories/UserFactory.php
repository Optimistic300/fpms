<?php

namespace Database\Factories;

use App\Models\Division;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'full_name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('password'),
            'role' => 'RESEARCHER',
            'division_id' => Division::factory(),
            'is_active' => true,
            'avatar_initials' => strtoupper(substr(fake()->name(), 0, 2)),
            'remember_token' => Str::random(10),
        ];
    }

    public function researcher(): static
    {
        return $this->state(fn() => ['role' => 'RESEARCHER']);
    }

    public function student(): static
    {
        return $this->state(fn() => ['role' => 'STUDENT']);
    }

    public function secretary(): static
    {
        return $this->state(fn() => ['role' => 'SECRETARY']);
    }

    public function divisionHead(): static
    {
        return $this->state(fn() => ['role' => 'DIVISION_HEAD']);
    }

    public function management(): static
    {
        return $this->state(fn() => ['role' => 'MANAGEMENT']);
    }

    public function admin(): static
    {
        return $this->state(fn() => ['role' => 'ADMIN']);
    }

    public function inactive(): static
    {
        return $this->state(fn() => ['is_active' => false]);
    }
}
