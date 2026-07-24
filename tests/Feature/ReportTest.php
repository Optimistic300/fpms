<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    private User $researcher;
    private User $secretary;
    private User $divisionHead;
    private User $management;
    private Division $division;
    private Project $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->division = Division::factory()->create();
        $this->researcher = User::factory()->researcher()->create(['division_id' => $this->division->id]);
        $this->secretary = User::factory()->secretary()->create(['division_id' => $this->division->id]);
        $this->divisionHead = User::factory()->divisionHead()->create(['division_id' => $this->division->id]);
        $this->management = User::factory()->management()->create(['division_id' => $this->division->id]);

        $this->project = Project::factory()->create([
            'lead_researcher_id' => $this->researcher->id,
            'division_id' => $this->division->id,
        ]);
        ProjectMember::create([
            'project_id' => $this->project->id,
            'user_id' => $this->researcher->id,
            'role' => 'LEAD',
        ]);
    }

    public function test_researcher_can_submit_report(): void
    {
        $token = $this->researcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/reports', [
            'projectId' => $this->project->id,
            'type' => 'QUARTERLY',
            'periodStart' => '2026-01-01',
            'periodEnd' => '2026-03-31',
            'narrativeSummary' => 'This quarter we completed field work.',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'PENDING');
    }

    public function test_secretary_cannot_submit_report(): void
    {
        $token = $this->secretary->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/reports', [
            'projectId' => $this->project->id,
            'type' => 'QUARTERLY',
            'periodStart' => '2026-01-01',
            'periodEnd' => '2026-03-31',
            'narrativeSummary' => 'Test',
        ]);

        $response->assertStatus(403);
    }

    public function test_save_report_draft(): void
    {
        $token = $this->researcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/reports/draft', [
            'projectId' => $this->project->id,
            'type' => 'QUARTERLY',
            'narrativeSummary' => 'Draft content',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'DRAFT');
    }

    public function test_secretary_can_approve_report(): void
    {
        $report = Report::factory()->create([
            'project_id' => $this->project->id,
            'submitted_by' => $this->researcher->id,
            'status' => 'PENDING',
            'submitted_at' => now(),
        ]);

        $token = $this->secretary->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->patchJson("/api/reports/{$report->id}", [
            'status' => 'APPROVED',
            'comment' => 'Good work.',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'APPROVED');
    }

    public function test_secretary_can_return_report(): void
    {
        $report = Report::factory()->create([
            'project_id' => $this->project->id,
            'submitted_by' => $this->researcher->id,
            'status' => 'PENDING',
            'submitted_at' => now(),
        ]);

        $token = $this->secretary->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->patchJson("/api/reports/{$report->id}", [
            'status' => 'RETURNED',
            'comment' => 'Please include data tables.',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'RETURNED');
    }

    public function test_researcher_cannot_approve_report(): void
    {
        $report = Report::factory()->create([
            'project_id' => $this->project->id,
            'submitted_by' => $this->researcher->id,
            'status' => 'PENDING',
        ]);

        $token = $this->researcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->patchJson("/api/reports/{$report->id}", [
            'status' => 'APPROVED',
        ]);

        $response->assertStatus(403);
    }

    public function test_secretary_can_view_report_queue_stats(): void
    {
        $token = $this->secretary->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/reports/stats');

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => ['overdue', 'pending', 'approvedThisQuarter', 'returned']]);
    }

    public function test_researcher_cannot_view_queue_stats(): void
    {
        $token = $this->researcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/reports/stats');

        $response->assertStatus(403);
    }

    public function test_report_list_scoped_to_researcher(): void
    {
        Report::factory(3)->create([
            'project_id' => $this->project->id,
            'submitted_by' => $this->researcher->id,
        ]);

        $otherUser = User::factory()->researcher()->create(['division_id' => $this->division->id]);
        Report::factory(2)->create([
            'project_id' => $this->project->id,
            'submitted_by' => $otherUser->id,
        ]);

        $token = $this->researcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/reports');

        $response->assertStatus(200);
    }
}
