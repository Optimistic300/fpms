<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Division;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectTest extends TestCase
{
    use RefreshDatabase;

    private User $researcher;
    private User $student;
    private User $secretary;
    private User $divisionHead;
    private User $management;
    private User $admin;
    private Division $division;
    private Division $otherDivision;

    protected function setUp(): void
    {
        parent::setUp();

        $this->division = Division::factory()->create(['name' => 'Forest Ecology']);
        $this->otherDivision = Division::factory()->create(['name' => 'Climate Change']);

        $this->researcher = User::factory()->researcher()->create(['division_id' => $this->division->id]);
        $this->student = User::factory()->student()->create(['division_id' => $this->division->id]);
        $this->secretary = User::factory()->secretary()->create(['division_id' => $this->division->id]);
        $this->divisionHead = User::factory()->divisionHead()->create(['division_id' => $this->division->id]);
        $this->management = User::factory()->management()->create(['division_id' => $this->division->id]);
        $this->admin = User::factory()->admin()->create(['division_id' => $this->division->id]);
    }

    public function test_researcher_can_create_project(): void
    {
        $token = $this->researcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/projects', [
            'title' => 'Test Project',
            'divisionId' => $this->division->id,
            'fundingType' => 'DONOR',
            'startDate' => '2026-01-01',
        ]);

        $response->assertStatus(201)
            ->assertJson(['message' => 'Project created successfully.']);
    }

    public function test_student_can_create_project(): void
    {
        $token = $this->student->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/projects', [
            'title' => 'Student Project',
            'divisionId' => $this->division->id,
            'fundingType' => 'GOVERNMENT',
            'startDate' => '2026-01-01',
        ]);

        $response->assertStatus(201);
    }

    public function test_secretary_cannot_create_project(): void
    {
        $token = $this->secretary->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/projects', [
            'title' => 'Secretary Project',
            'divisionId' => $this->division->id,
            'fundingType' => 'DONOR',
            'startDate' => '2026-01-01',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_cannot_create_project(): void
    {
        $token = $this->admin->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/projects', [
            'title' => 'Admin Project',
            'divisionId' => $this->division->id,
            'fundingType' => 'DONOR',
            'startDate' => '2026-01-01',
        ]);

        $response->assertStatus(403);
    }

    public function test_project_owner_can_view_project(): void
    {
        $project = Project::factory()->create([
            'lead_researcher_id' => $this->researcher->id,
            'division_id' => $this->division->id,
        ]);
        ProjectMember::create(['project_id' => $project->id, 'user_id' => $this->researcher->id, 'role' => 'LEAD']);

        $token = $this->researcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson("/api/projects/{$project->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $project->id);
    }

    public function test_non_member_gets_locked_project(): void
    {
        $project = Project::factory()->create([
            'lead_researcher_id' => $this->researcher->id,
            'division_id' => $this->division->id,
        ]);
        ProjectMember::create(['project_id' => $project->id, 'user_id' => $this->researcher->id, 'role' => 'LEAD']);

        $otherResearcher = User::factory()->researcher()->create(['division_id' => $this->division->id]);
        $token = $otherResearcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson("/api/projects/{$project->id}");

        $response->assertStatus(403)
            ->assertJsonPath('data.isLocked', true);
    }

    public function test_division_head_can_view_division_project(): void
    {
        $project = Project::factory()->create([
            'lead_researcher_id' => $this->researcher->id,
            'division_id' => $this->division->id,
        ]);
        ProjectMember::create(['project_id' => $project->id, 'user_id' => $this->researcher->id, 'role' => 'LEAD']);

        $token = $this->divisionHead->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson("/api/projects/{$project->id}");

        $response->assertStatus(200);
    }

    public function test_project_owner_can_edit_project(): void
    {
        $project = Project::factory()->create([
            'lead_researcher_id' => $this->researcher->id,
            'division_id' => $this->division->id,
        ]);
        ProjectMember::create(['project_id' => $project->id, 'user_id' => $this->researcher->id, 'role' => 'LEAD']);

        $token = $this->researcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->putJson("/api/projects/{$project->id}", [
            'title' => 'Updated Title',
        ]);

        $response->assertStatus(200);
    }

    public function test_collaborator_cannot_edit_project(): void
    {
        $project = Project::factory()->create([
            'lead_researcher_id' => $this->researcher->id,
            'division_id' => $this->division->id,
        ]);
        ProjectMember::create(['project_id' => $project->id, 'user_id' => $this->researcher->id, 'role' => 'LEAD']);

        $collaborator = User::factory()->researcher()->create(['division_id' => $this->division->id]);
        ProjectMember::create(['project_id' => $project->id, 'user_id' => $collaborator->id, 'role' => 'COLLABORATOR']);
        $token = $collaborator->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->putJson("/api/projects/{$project->id}", [
            'title' => 'Hacked Title',
        ]);

        $response->assertStatus(403);
    }

    public function test_request_access_creates_pending_request(): void
    {
        $project = Project::factory()->create([
            'lead_researcher_id' => $this->researcher->id,
            'division_id' => $this->division->id,
        ]);
        ProjectMember::create(['project_id' => $project->id, 'user_id' => $this->researcher->id, 'role' => 'LEAD']);

        $requester = User::factory()->researcher()->create(['division_id' => $this->otherDivision->id]);
        $token = $requester->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson("/api/projects/{$project->id}/access-requests");

        $response->assertStatus(201);
    }

    public function test_list_projects_returns_paginated_results(): void
    {
        $token = $this->researcher->createToken('test')->plainTextToken;

        Project::factory(5)->create([
            'lead_researcher_id' => $this->researcher->id,
            'division_id' => $this->division->id,
        ]);

        $response = $this->withToken($token)->getJson('/api/projects?limit=2');

        $response->assertStatus(200)
            ->assertJsonStructure(['data', 'meta' => ['currentPage', 'lastPage', 'perPage', 'total']]);
    }
}
