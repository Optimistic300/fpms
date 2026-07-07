<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InstituteTest extends TestCase
{
    use RefreshDatabase;

    private User $management;
    private User $researcher;
    private Division $division;

    protected function setUp(): void
    {
        parent::setUp();

        $this->division = Division::factory()->create();
        $this->management = User::factory()->management()->create(['division_id' => $this->division->id]);
        $this->researcher = User::factory()->researcher()->create(['division_id' => $this->division->id]);
    }

    public function test_management_can_view_institute_stats(): void
    {
        $token = $this->management->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/institute/stats');

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => ['totalProjects', 'ongoing', 'divisionsActive', 'reportsPendingReview', 'reportsOverdue', 'libraryDocuments']]);
    }

    public function test_researcher_cannot_view_institute_stats(): void
    {
        $token = $this->researcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/institute/stats');

        $response->assertStatus(403);
    }

    public function test_management_can_view_division_summary(): void
    {
        $token = $this->management->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/divisions/summary');

        $response->assertStatus(200);
    }

    public function test_management_can_view_funding_breakdown(): void
    {
        $token = $this->management->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/institute/funding-breakdown');

        $response->assertStatus(200);
    }

    public function test_management_can_view_compliance(): void
    {
        $token = $this->management->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/institute/compliance');

        $response->assertStatus(200);
    }

    public function test_management_can_view_alerts(): void
    {
        $token = $this->management->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/institute/alerts');

        $response->assertStatus(200);
    }
}
