<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    private User $researcher;

    protected function setUp(): void
    {
        parent::setUp();

        $division = Division::factory()->create();
        $this->researcher = User::factory()->researcher()->create(['division_id' => $division->id]);
    }

    public function test_dashboard_stats(): void
    {
        $token = $this->researcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/dashboard/stats');

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => ['totalProjects', 'ongoing', 'reportsPending', 'activitiesThisMonth']]);
    }

    public function test_dashboard_requires_auth(): void
    {
        $response = $this->getJson('/api/dashboard/stats');

        $response->assertStatus(401);
    }
}
