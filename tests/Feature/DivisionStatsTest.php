<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DivisionStatsTest extends TestCase
{
    use RefreshDatabase;

    private Division $division;
    private User $divisionHead;
    private User $researcher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->division = Division::factory()->create();
        $this->divisionHead = User::factory()->divisionHead()->create(['division_id' => $this->division->id]);
        $this->researcher = User::factory()->researcher()->create(['division_id' => $this->division->id]);
    }

    public function test_division_head_can_view_division_stats(): void
    {
        $token = $this->divisionHead->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson("/api/divisions/{$this->division->id}/stats");

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => ['totalProjects', 'ongoing', 'reportsPending', 'activeResearchers']]);
    }

    public function test_researcher_cannot_view_division_stats(): void
    {
        $token = $this->researcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson("/api/divisions/{$this->division->id}/stats");

        $response->assertStatus(403);
    }

    public function test_division_head_can_view_researcher_activity(): void
    {
        $token = $this->divisionHead->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson("/api/divisions/{$this->division->id}/researcher-activity");

        $response->assertStatus(200);
    }

    public function test_division_head_can_view_activity_feed(): void
    {
        $token = $this->divisionHead->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson("/api/divisions/{$this->division->id}/activity-feed");

        $response->assertStatus(200);
    }
}
