<?php

namespace Tests\Feature;

use App\Contracts\AiQueryResult;
use App\Contracts\AiRetrievalInterface;
use App\Jobs\SyncDocumentIndex;
use App\Models\Division;
use App\Models\Document;
use App\Models\DocumentChunk;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

class AiTest extends TestCase
{
    use DatabaseMigrations;

    private User $user;
    private Division $division;

    protected function setUp(): void
    {
        parent::setUp();

        $this->division = Division::factory()->create();
        $this->user = User::factory()->researcher()->create(['division_id' => $this->division->id]);
    }

    public function test_authentication_required(): void
    {
        $response = $this->postJson('/api/ai/query', [
            'query' => 'test query',
        ]);

        $response->assertStatus(401);
    }

    public function test_successful_query_returns_citations(): void
    {
        Bus::fake();

        $project = Project::factory()->create([
            'lead_researcher_id' => $this->user->id,
            'division_id' => $this->division->id,
        ]);
        ProjectMember::create([
            'project_id' => $project->id,
            'user_id' => $this->user->id,
            'role' => 'LEAD',
        ]);

        $doc = Document::factory()->create([
            'project_id' => $project->id,
            'uploaded_by' => $this->user->id,
            'filename' => 'carbon_sequestration_report.pdf',
            'published' => true,
        ]);

        // Create document chunks to simulate indexing
        DocumentChunk::factory()->create([
            'document_id' => $doc->id,
            'chunk_index' => 0,
            'content' => 'Carbon sequestration in agroforestry systems is a key area of research. FORIG has conducted studies on carbon storage in cocoa agroforests and mixed timber systems.',
            'page_number' => 12,
        ]);

        $token = $this->user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/ai/query', [
            'query' => 'carbon sequestration agroforestry',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'canAnswer',
                'answer',
                'citations' => [
                    '*' => ['id', 'documentId', 'title', 'author', 'division', 'fileType', 'page', 'locator', 'snippet'],
                ],
                'followUpPrompts',
                'banner',
            ],
        ]);
        $response->assertJsonPath('data.canAnswer', true);
        $response->assertJsonPath('data.citations.0.documentId', $doc->id);
    }

    public function test_no_results_returns_cannot_answer(): void
    {
        Bus::fake();

        $token = $this->user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/ai/query', [
            'query' => 'zzzzzzzzzzzzzzzzzxyznonexistent',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'canAnswer',
                'answer',
                'citations',
                'followUpPrompts',
                'banner',
            ],
        ]);
        $response->assertJsonPath('data.canAnswer', false);
        $response->assertJsonPath('data.answer', 'The library does not contain enough information to answer this.');
        $response->assertJsonPath('data.followUpPrompts', ['Browse the library', 'Try different terms']);
    }

    public function test_service_failure_returns_error(): void
    {
        // Mock the LLM service to throw an exception
        $this->mock(\App\Contracts\LlmClient::class, function ($mock) {
            $mock->shouldReceive('rewriteQuery')
                ->andThrow(new \App\Exceptions\LlmUnavailable('Service unavailable'));
        });

        $token = $this->user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/ai/query', [
            'query' => 'test query',
        ]);

        $response->assertStatus(408);
        $response->assertJson([
            'message' => 'The assistant took too long to respond. Please try again.',
        ]);
    }

    public function test_indexing_job_dispatched_on_publish(): void
    {
        Bus::fake();

        $project = Project::factory()->create([
            'lead_researcher_id' => $this->user->id,
            'division_id' => $this->division->id,
        ]);
        ProjectMember::create([
            'project_id' => $project->id,
            'user_id' => $this->user->id,
            'role' => 'LEAD',
        ]);

        $doc = Document::factory()->create([
            'project_id' => $project->id,
            'uploaded_by' => $this->user->id,
            'published' => false,
        ]);

        $token = $this->user->createToken('test')->plainTextToken;

        $this->withToken($token)->patchJson("/api/documents/{$doc->id}", [
            'published' => true,
        ]);

        Bus::assertDispatched(SyncDocumentIndex::class, function ($job) use ($doc) {
            return $job->document->id === $doc->id;
        });
    }

    public function test_only_published_documents_are_searchable(): void
    {
        $project = Project::factory()->create([
            'lead_researcher_id' => $this->user->id,
            'division_id' => $this->division->id,
        ]);
        ProjectMember::create([
            'project_id' => $project->id,
            'user_id' => $this->user->id,
            'role' => 'LEAD',
        ]);

        $publishedDoc = Document::factory()->create([
            'project_id' => $project->id,
            'uploaded_by' => $this->user->id,
            'published' => true,
        ]);

        $unpublishedDoc = Document::factory()->create([
            'project_id' => $project->id,
            'uploaded_by' => $this->user->id,
            'published' => false,
        ]);

        // Create chunks for both documents
        DocumentChunk::factory()->create([
            'document_id' => $publishedDoc->id,
            'content' => 'Published content',
        ]);

        DocumentChunk::factory()->create([
            'document_id' => $unpublishedDoc->id,
            'content' => 'Unpublished content',
        ]);

        // Simulate indexing (make searchable)
        $publishedDoc->chunks()->searchable();
        $unpublishedDoc->chunks()->searchable();

        $token = $this->user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/ai/query', [
            'query' => 'content',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.canAnswer', true);

        // Should only find the published document
        $response->assertJsonPath('data.citations.0.documentId', $publishedDoc->id);
        $response->assertJsonMissingPath('data.citations.1'); // Should not have second citation
    }
}