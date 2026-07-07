<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Division;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ActivityTest extends TestCase
{
    use RefreshDatabase;

    private User $researcher;
    private User $student;
    private User $secretary;
    private Division $division;
    private Project $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->division = Division::factory()->create();
        $this->researcher = User::factory()->researcher()->create(['division_id' => $this->division->id]);
        $this->student = User::factory()->student()->create(['division_id' => $this->division->id]);
        $this->secretary = User::factory()->secretary()->create(['division_id' => $this->division->id]);

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

    public function test_researcher_can_log_activity(): void
    {
        $token = $this->researcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/activities', [
            'projectId' => $this->project->id,
            'date' => '2026-06-15',
            'type' => 'Field data collection',
            'description' => 'GPS coordinates taken',
            'notes' => 'Weather was clear',
        ]);

        $response->assertStatus(201)
            ->assertJson(['message' => 'Activity created. You can now upload files.']);
    }

    public function test_secretary_cannot_log_activity(): void
    {
        $token = $this->secretary->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/activities', [
            'projectId' => $this->project->id,
            'date' => '2026-06-15',
            'type' => 'Field data collection',
            'description' => 'Test',
        ]);

        $response->assertStatus(403);
    }

    public function test_activity_owner_can_edit(): void
    {
        $activity = Activity::factory()->create([
            'project_id' => $this->project->id,
            'user_id' => $this->researcher->id,
        ]);

        $token = $this->researcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->putJson("/api/activities/{$activity->id}", [
            'description' => 'Updated description',
        ]);

        $response->assertStatus(200);
    }

    public function test_other_user_cannot_edit_activity(): void
    {
        $activity = Activity::factory()->create([
            'project_id' => $this->project->id,
            'user_id' => $this->researcher->id,
        ]);

        $otherUser = User::factory()->researcher()->create(['division_id' => $this->division->id]);
        $token = $otherUser->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->putJson("/api/activities/{$activity->id}", [
            'description' => 'Hacked',
        ]);

        $response->assertStatus(403);
    }

    public function test_owner_can_delete_activity(): void
    {
        $activity = Activity::factory()->create([
            'project_id' => $this->project->id,
            'user_id' => $this->researcher->id,
        ]);

        $token = $this->researcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->deleteJson("/api/activities/{$activity->id}");

        $response->assertStatus(200);
    }

    public function test_list_activities_returns_paginated(): void
    {
        Activity::factory(3)->create([
            'project_id' => $this->project->id,
            'user_id' => $this->researcher->id,
        ]);

        $token = $this->researcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/activities');

        $response->assertStatus(200)
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_activity_types_list(): void
    {
        \App\Models\ActivityType::factory(3)->create();

        $token = $this->researcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/activity-types');

        $response->assertStatus(200)
            ->assertJsonStructure(['data']);
    }

    public function test_activity_csv_export(): void
    {
        $token = $this->researcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/activities?format=csv');

        $response->assertStatus(200);
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type') ?? '');
    }

    public function test_collaborator_can_log_activity(): void
    {
        $collaborator = User::factory()->researcher()->create(['division_id' => $this->division->id]);
        ProjectMember::create([
            'project_id' => $this->project->id,
            'user_id' => $collaborator->id,
            'role' => 'COLLABORATOR',
        ]);
        $token = $collaborator->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/activities', [
            'projectId' => $this->project->id,
            'date' => '2026-06-15',
            'type' => 'Lab analysis',
            'description' => 'Soil sample analysis',
        ]);

        $response->assertStatus(201);
    }
}
