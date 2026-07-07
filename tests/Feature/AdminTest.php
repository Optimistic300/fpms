<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $researcher;
    private Division $division;

    protected function setUp(): void
    {
        parent::setUp();

        $this->division = Division::factory()->create();
        $this->admin = User::factory()->admin()->create(['division_id' => $this->division->id]);
        $this->researcher = User::factory()->researcher()->create(['division_id' => $this->division->id]);
    }

    public function test_admin_can_list_users(): void
    {
        $token = $this->admin->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/admin/users');

        $response->assertStatus(200);
    }

    public function test_researcher_cannot_list_users(): void
    {
        $token = $this->researcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/admin/users');

        $response->assertStatus(403);
    }

    public function test_admin_can_create_user(): void
    {
        $token = $this->admin->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/admin/users', [
            'email' => 'newuser@forig.org',
            'password' => 'password123',
            'fullName' => 'New User',
            'role' => 'RESEARCHER',
            'divisionId' => $this->division->id,
        ]);

        $response->assertStatus(201);
    }

    public function test_admin_can_update_user(): void
    {
        $token = $this->admin->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->putJson("/api/admin/users/{$this->researcher->id}", [
            'isActive' => false,
        ]);

        $response->assertStatus(200);
    }

    public function test_admin_can_list_divisions(): void
    {
        $token = $this->admin->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/admin/divisions');

        $response->assertStatus(200);
    }

    public function test_admin_can_create_division(): void
    {
        $token = $this->admin->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/admin/divisions', [
            'name' => 'New Division',
        ]);

        $response->assertStatus(201);
    }

    public function test_admin_can_list_activity_types(): void
    {
        $token = $this->admin->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/admin/activity-types');

        $response->assertStatus(200);
    }

    public function test_admin_can_create_activity_type(): void
    {
        $token = $this->admin->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/admin/activity-types', [
            'name' => 'Field Data Collection',
            'slug' => 'field-data-collection',
        ]);

        $response->assertStatus(201);
    }

    public function test_researcher_cannot_create_activity_type(): void
    {
        $token = $this->researcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/admin/activity-types', [
            'name' => 'Should Not Work',
            'slug' => 'should-not-work',
        ]);

        $response->assertStatus(403);
    }

    public function test_researcher_cannot_create_division(): void
    {
        $token = $this->researcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/admin/divisions', [
            'name' => 'Not Allowed',
        ]);

        $response->assertStatus(403);
    }

    public function test_researcher_cannot_create_user(): void
    {
        $token = $this->researcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/admin/users', [
            'email' => 'hacker@forig.org',
            'password' => 'password123',
            'fullName' => 'Hacker',
            'role' => 'ADMIN',
            'divisionId' => $this->division->id,
        ]);

        $response->assertStatus(403);
    }
}
