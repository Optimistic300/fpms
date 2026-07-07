<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\ActivityType;
use App\Models\Division;
use App\Models\Document;
use App\Models\InboxItem;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\Publication;
use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_has_roles_check_methods(): void
    {
        $division = Division::factory()->create();

        $researcher = User::factory()->researcher()->create(['division_id' => $division->id]);
        $this->assertTrue($researcher->isResearcher());
        $this->assertFalse($researcher->isAdmin());

        $admin = User::factory()->admin()->create(['division_id' => $division->id]);
        $this->assertTrue($admin->isAdmin());
        $this->assertFalse($admin->isResearcher());

        $student = User::factory()->student()->create(['division_id' => $division->id]);
        $this->assertTrue($student->isStudent());

        $secretary = User::factory()->secretary()->create(['division_id' => $division->id]);
        $this->assertTrue($secretary->isSecretary());

        $dh = User::factory()->divisionHead()->create(['division_id' => $division->id]);
        $this->assertTrue($dh->isDivisionHead());

        $mgmt = User::factory()->management()->create(['division_id' => $division->id]);
        $this->assertTrue($mgmt->isManagement());
    }

    public function test_user_is_active_default(): void
    {
        $division = Division::factory()->create();
        $user = User::factory()->researcher()->create(['division_id' => $division->id]);

        $this->assertTrue($user->is_active);
    }

    public function test_user_inactive(): void
    {
        $division = Division::factory()->create();
        $user = User::factory()->inactive()->create(['division_id' => $division->id]);

        $this->assertFalse($user->is_active);
    }

    public function test_project_relations(): void
    {
        $division = Division::factory()->create();
        $lead = User::factory()->researcher()->create(['division_id' => $division->id]);
        $project = Project::factory()->create([
            'lead_researcher_id' => $lead->id,
            'division_id' => $division->id,
        ]);

        $this->assertInstanceOf(Division::class, $project->division);
        $this->assertInstanceOf(User::class, $project->lead);
        $this->assertEquals($lead->id, $project->lead->id);

        $member = ProjectMember::factory()->create([
            'project_id' => $project->id,
            'user_id' => $lead->id,
            'role' => 'LEAD',
        ]);

        $this->assertTrue($project->members->contains($member));
    }

    public function test_publication_relations(): void
    {
        $division = Division::factory()->create();
        $user = User::factory()->researcher()->create(['division_id' => $division->id]);
        $project = Project::factory()->create([
            'lead_researcher_id' => $user->id,
            'division_id' => $division->id,
        ]);
        $publication = Publication::factory()->create([
            'submitted_by_id' => $user->id,
            'linked_project_id' => $project->id,
        ]);

        $this->assertInstanceOf(User::class, $publication->submitter);
        $this->assertEquals($user->id, $publication->submitter->id);
        $this->assertInstanceOf(Project::class, $publication->linkedProject);
    }

    public function test_report_relations(): void
    {
        $division = Division::factory()->create();
        $user = User::factory()->researcher()->create(['division_id' => $division->id]);
        $project = Project::factory()->create([
            'lead_researcher_id' => $user->id,
            'division_id' => $division->id,
        ]);
        $report = Report::factory()->create([
            'project_id' => $project->id,
            'submitted_by' => $user->id,
        ]);

        $this->assertInstanceOf(Project::class, $report->project);
        $this->assertInstanceOf(User::class, $report->submitter);
    }

    public function test_document_relations(): void
    {
        $division = Division::factory()->create();
        $user = User::factory()->researcher()->create(['division_id' => $division->id]);
        $project = Project::factory()->create([
            'lead_researcher_id' => $user->id,
            'division_id' => $division->id,
        ]);
        $document = Document::factory()->create([
            'project_id' => $project->id,
            'uploaded_by' => $user->id,
        ]);

        $this->assertInstanceOf(Project::class, $document->project);
        $this->assertInstanceOf(User::class, $document->uploader);
    }

    public function test_activity_relations(): void
    {
        $division = Division::factory()->create();
        $user = User::factory()->researcher()->create(['division_id' => $division->id]);
        $project = Project::factory()->create([
            'lead_researcher_id' => $user->id,
            'division_id' => $division->id,
        ]);
        $activity = Activity::factory()->create([
            'project_id' => $project->id,
            'user_id' => $user->id,
        ]);

        $this->assertInstanceOf(Project::class, $activity->project);
        $this->assertInstanceOf(User::class, $activity->user);
    }

    public function test_division_model(): void
    {
        $division = Division::factory()->create(['name' => 'Forest Ecology']);

        $this->assertEquals('Forest Ecology', $division->name);
        $this->assertNull($division->head);

        $head = User::factory()->divisionHead()->create(['division_id' => $division->id]);
        $division->update(['head_id' => $head->id]);

        $this->assertInstanceOf(User::class, $division->fresh()->head);
    }

    public function test_activity_type_factory(): void
    {
        $type = ActivityType::factory()->create(['name' => 'Field Data Collection', 'slug' => 'field-data']);

        $this->assertModelExists($type);
        $this->assertEquals('field-data', $type->slug);
    }

    public function test_inbox_item_relations(): void
    {
        $division = Division::factory()->create();
        $user = User::factory()->researcher()->create(['division_id' => $division->id]);
        $sender = User::factory()->researcher()->create(['division_id' => $division->id]);
        $inboxItem = InboxItem::factory()->create([
            'user_id' => $user->id,
            'sender_id' => $sender->id,
        ]);

        $this->assertInstanceOf(User::class, $inboxItem->user);
        $this->assertInstanceOf(User::class, $inboxItem->sender);
    }
}
