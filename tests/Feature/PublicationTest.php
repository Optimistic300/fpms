<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\Publication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicationTest extends TestCase
{
    use RefreshDatabase;

    private User $researcher;
    private User $secretary;
    private Division $division;

    protected function setUp(): void
    {
        parent::setUp();

        $this->division = Division::factory()->create();
        $this->researcher = User::factory()->researcher()->create(['division_id' => $this->division->id]);
        $this->secretary = User::factory()->secretary()->create(['division_id' => $this->division->id]);
    }

    public function test_researcher_can_create_publication(): void
    {
        $token = $this->researcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/publications', [
            'title' => 'Carbon Sequestration in Agroforestry',
            'authors' => 'Yaa Asantewaa, Kofi Mensah',
            'type' => 'PAPER',
            'status' => 'SUBMITTED',
            'journalName' => 'Forest Ecology and Management',
        ]);

        $response->assertStatus(201);
    }

    public function test_secretary_can_view_publications(): void
    {
        Publication::factory(3)->create(['submitted_by_id' => $this->researcher->id]);

        $token = $this->secretary->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/publications');

        $response->assertStatus(200)
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_pipeline_counts(): void
    {
        Publication::factory()->create(['submitted_by_id' => $this->researcher->id, 'status' => 'DRAFT']);
        Publication::factory()->create(['submitted_by_id' => $this->researcher->id, 'status' => 'PUBLISHED']);

        $token = $this->researcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/publications/pipeline');

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => ['draft', 'submitted', 'inRevision', 'published']]);
    }

    public function test_researcher_can_update_own_publication(): void
    {
        $publication = Publication::factory()->create([
            'submitted_by_id' => $this->researcher->id,
            'title' => 'Original Title',
            'status' => 'DRAFT',
        ]);

        $token = $this->researcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->putJson("/api/publications/{$publication->id}", [
            'title' => 'Updated Title',
            'status' => 'SUBMITTED',
        ]);

        $response->assertStatus(200);
    }

    public function test_other_user_cannot_update_publication(): void
    {
        $publication = Publication::factory()->create([
            'submitted_by_id' => $this->researcher->id,
        ]);

        $otherUser = User::factory()->researcher()->create(['division_id' => $this->division->id]);
        $token = $otherUser->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->putJson("/api/publications/{$publication->id}", [
            'title' => 'Hacked Title',
        ]);

        $response->assertStatus(403);
    }

    public function test_publication_requires_doi_when_published(): void
    {
        $token = $this->researcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/publications', [
            'title' => 'Test Paper',
            'authors' => 'Author',
            'type' => 'PAPER',
            'status' => 'PUBLISHED',
        ]);

        $response->assertStatus(422);
    }
}
