<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RateLimitingTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_rate_limiting(): void
    {
        $division = Division::factory()->create();
        User::factory()->researcher()->create([
            'email' => 'test@forig.org',
            'password' => Hash::make('password'),
            'division_id' => $division->id,
        ]);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/login', [
                'email' => 'test@forig.org',
                'password' => 'wrong',
            ]);
        }

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@forig.org',
            'password' => 'wrong',
        ]);

        $response->assertStatus(429);
    }
}
