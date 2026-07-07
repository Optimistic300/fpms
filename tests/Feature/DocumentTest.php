<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Division;
use App\Models\Document;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentTest extends TestCase
{
    use RefreshDatabase;

    private User $researcher;
    private Division $division;
    private Project $project;
    private Activity $activity;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');

        $this->division = Division::factory()->create();
        $this->researcher = User::factory()->researcher()->create(['division_id' => $this->division->id]);

        $this->project = Project::factory()->create([
            'lead_researcher_id' => $this->researcher->id,
            'division_id' => $this->division->id,
        ]);
        ProjectMember::create([
            'project_id' => $this->project->id,
            'user_id' => $this->researcher->id,
            'role' => 'LEAD',
        ]);

        $this->activity = Activity::factory()->create([
            'project_id' => $this->project->id,
            'user_id' => $this->researcher->id,
        ]);
    }

    public function test_upload_document_to_activity(): void
    {
        $token = $this->researcher->createToken('test')->plainTextToken;

        $file = UploadedFile::fake()->create('document.pdf', 1024);

        $response = $this->withToken($token)
            ->postJson("/api/activities/{$this->activity->id}/documents", [
                'file' => $file,
                'type' => 'DATA_SHEET',
            ]);

        $response->assertStatus(201)
            ->assertJson(['message' => 'File uploaded.']);
    }

    public function test_publish_document(): void
    {
        $doc = Document::factory()->create([
            'project_id' => $this->project->id,
            'uploaded_by' => $this->researcher->id,
            'published' => false,
        ]);

        $token = $this->researcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->patchJson("/api/documents/{$doc->id}", [
            'published' => true,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.published', true);
    }

    public function test_delete_document(): void
    {
        $doc = Document::factory()->create([
            'project_id' => $this->project->id,
            'uploaded_by' => $this->researcher->id,
            'file_path' => 'documents/test.pdf',
        ]);

        $token = $this->researcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->deleteJson("/api/documents/{$doc->id}");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Document removed.']);
    }

    public function test_list_documents(): void
    {
        Document::factory(3)->create([
            'project_id' => $this->project->id,
            'uploaded_by' => $this->researcher->id,
        ]);

        $token = $this->researcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/documents');

        $response->assertStatus(200)
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_preview_document(): void
    {
        $doc = Document::factory()->create([
            'project_id' => $this->project->id,
            'uploaded_by' => $this->researcher->id,
            'published' => true,
        ]);

        $token = $this->researcher->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson("/api/documents/{$doc->id}/preview");

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => ['filename', 'mimeType', 'previewUrl', 'inlinePreviewSupported']]);
    }
}
