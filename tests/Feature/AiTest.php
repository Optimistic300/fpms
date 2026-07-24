<?php

namespace Tests\Feature;

use App\Contracts\AiQueryResult;
use App\Contracts\AiRetrievalInterface;
use App\Jobs\IndexDocumentForAi;
use App\Models\Division;
use App\Models\Document;
use App\Models\DocumentText;
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

        DocumentText::factory()->create([
            'document_id' => $doc->id,
            'content' => 'Carbon sequestration in agroforestry systems is a key area of research. FORIG has conducted studies on carbon storage in cocoa agroforests and mixed timber systems.',
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
                    '*' => ['id', 'documentId', 'title', 'author', 'division', 'fileType', 'page'],
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
        $response->assertJsonPath('data.citations', []);
        $response->assertJsonPath('data.answer', 'The library does not contain enough information to answer this.');
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

        Bus::assertDispatched(IndexDocumentForAi::class, function ($job) use ($doc) {
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

        $unpublishedDoc = Document::factory()->create([
            'project_id' => $project->id,
            'uploaded_by' => $this->user->id,
            'filename' => 'unpublished.pdf',
            'published' => false,
        ]);

        DocumentText::factory()->create([
            'document_id' => $unpublishedDoc->id,
            'content' => 'This content should not be searchable via the AI assistant.',
        ]);

        $token = $this->user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/ai/query', [
            'query' => 'searchable',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.canAnswer', false);
    }

    public function test_banner_included_in_response(): void
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

        $doc = Document::factory()->create([
            'project_id' => $project->id,
            'uploaded_by' => $this->user->id,
            'filename' => 'test.pdf',
            'published' => true,
        ]);

        DocumentText::factory()->create([
            'document_id' => $doc->id,
            'content' => 'Some test content about forestry research.',
        ]);

        $token = $this->user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/ai/query', [
            'query' => 'forestry',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.canAnswer', true);
        $response->assertJsonPath('data.banner', 'This answer draws only from FORIG\'s own library. It is not a literature review. For published external research use Google Scholar or Web of Science.');
    }

    public function test_timeout_returns_408(): void
    {
        $mock = $this->createMock(AiRetrievalInterface::class);
        $mock->method('query')
            ->willThrowException(new \RuntimeException('Timeout'));

        $this->app->instance(AiRetrievalInterface::class, $mock);

        $token = $this->user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/ai/query', [
            'query' => 'something',
        ]);

        $response->assertStatus(408);
        $response->assertJson([
            'message' => 'The assistant took too long to respond. Please try again.',
        ]);
    }
}
