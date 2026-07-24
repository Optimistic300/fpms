<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\Document;
use App\Models\InboxItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InboxTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private User $sender;

    protected function setUp(): void
    {
        parent::setUp();

        $division = Division::factory()->create();
        $this->user = User::factory()->researcher()->create(['division_id' => $division->id]);
        $this->sender = User::factory()->researcher()->create(['division_id' => $division->id]);
    }

    public function test_list_inbox_items(): void
    {
        InboxItem::factory(3)->create(['user_id' => $this->user->id]);

        $token = $this->user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/inbox');

        $response->assertStatus(200)
            ->assertJsonStructure(['data', 'meta' => ['unreadCount']]);
    }

    public function test_mark_item_as_read(): void
    {
        $item = InboxItem::factory()->create(['user_id' => $this->user->id, 'read' => false]);

        $token = $this->user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->patchJson("/api/inbox/{$item->id}/read");

        $response->assertStatus(200)
            ->assertJsonPath('data.read', true);
    }

    public function test_mark_all_as_read(): void
    {
        InboxItem::factory(5)->create(['user_id' => $this->user->id, 'read' => false]);

        $token = $this->user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->patchJson('/api/inbox/read-all');

        $response->assertStatus(200);
    }

    public function test_forward_document(): void
    {
        $doc = Document::factory()->create(['uploaded_by' => $this->user->id]);
        $recipient = User::factory()->researcher()->create(['division_id' => Division::factory()->create()->id]);

        $token = $this->user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/inbox/forward', [
            'documentId' => $doc->id,
            'recipientIds' => [$recipient->id],
            'message' => 'Check this out!',
        ]);

        $response->assertStatus(201);
    }
}
