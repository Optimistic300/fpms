<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    private User $activeUser;
    private User $inactiveUser;

    protected function setUp(): void
    {
        parent::setUp();

        $division = Division::factory()->create();

        $this->activeUser = User::factory()->researcher()->create([
            'email' => 'active@forig.org',
            'password' => Hash::make('password'),
            'division_id' => $division->id,
        ]);

        $this->inactiveUser = User::factory()->inactive()->create([
            'email' => 'inactive@forig.org',
            'password' => Hash::make('password'),
            'division_id' => $division->id,
        ]);
    }

    public function test_login_with_valid_credentials_returns_token(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'active@forig.org',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['token', 'userId', 'fullName', 'email', 'role', 'division'],
            ]);
    }

    public function test_login_with_invalid_credentials_returns_422(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'active@forig.org',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_login_with_inactive_user_returns_403(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'inactive@forig.org',
            'password' => 'password',
        ]);

        $response->assertStatus(403)
            ->assertJson(['message' => 'Your account has been deactivated. Contact an administrator.']);
    }

    public function test_logout_revokes_token(): void
    {
        $token = $this->activeUser->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/auth/logout');

        $response->assertStatus(200)
            ->assertJson(['message' => 'Logged out successfully.']);
    }

    public function test_validate_token_returns_user_data(): void
    {
        $token = $this->activeUser->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/auth/validate');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'valid' => true,
                    'userId' => $this->activeUser->id,
                    'role' => 'RESEARCHER',
                ],
            ]);
    }

    public function test_validate_token_without_token_returns_401(): void
    {
        $response = $this->getJson('/api/auth/validate');

        $response->assertStatus(401);
    }

    public function test_public_stats_endpoint_works(): void
    {
        $response = $this->getJson('/api/public/stats');

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => ['activeProjects', 'libraryDocuments', 'divisionsConnected']]);
    }
}
