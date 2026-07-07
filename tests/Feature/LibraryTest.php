<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\Document;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LibraryTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Division $division;

    protected function setUp(): void
    {
        parent::setUp();

        $this->division = Division::factory()->create();
        $this->user = User::factory()->researcher()->create(['division_id' => $this->division->id]);
    }

    public function test_library_stats(): void
    {
        $token = $this->user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/library/stats');

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => ['totalDocuments', 'topDivisions', 'addedThisQuarter']]);
    }

    public function test_library_documents(): void
    {
        Document::factory(3)->create([
            'uploaded_by' => $this->user->id,
            'published' => true,
        ]);

        $token = $this->user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/library/documents');

        $response->assertStatus(200)
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_library_search(): void
    {
        Document::factory()->create([
            'uploaded_by' => $this->user->id,
            'filename' => 'carbon_report.pdf',
            'published' => true,
        ]);

        $token = $this->user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/library/search?q=carbon');

        $response->assertStatus(200)
            ->assertJsonStructure(['data', 'meta']);
    }
}
