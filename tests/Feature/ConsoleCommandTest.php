<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\InboxItem;
use App\Models\Project;
use App\Models\Publication;
use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class ConsoleCommandTest extends TestCase
{
    use RefreshDatabase;

    private Division $division;
    private User $secretary;
    private User $management;
    private User $researcher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->division = Division::factory()->create();

        $this->secretary = User::factory()->secretary()->create(['division_id' => $this->division->id]);
        $this->management = User::factory()->management()->create(['division_id' => $this->division->id]);
        $this->researcher = User::factory()->researcher()->create(['division_id' => $this->division->id]);
    }

    public function test_calculate_report_overdue_with_no_overdue_reports(): void
    {
        $exitCode = Artisan::call('reports:calculate-overdue');

        $this->assertEquals(0, $exitCode);
        $output = Artisan::output();
        $this->assertStringContainsString('Reports marked as overdue: 0', $output);
    }

    public function test_calculate_report_overdue_marks_and_alerts(): void
    {
        $project = Project::factory()->create([
            'division_id' => $this->division->id,
            'lead_researcher_id' => $this->researcher->id,
        ]);

        $report = Report::factory()->create([
            'project_id' => $project->id,
            'submitted_by' => $this->researcher->id,
            'status' => 'PENDING',
            'submitted_at' => now()->subDays(10),
            'is_overdue' => false,
        ]);

        $exitCode = Artisan::call('reports:calculate-overdue');

        $this->assertEquals(0, $exitCode);
        $output = Artisan::output();
        $this->assertStringContainsString('Reports marked as overdue: 1', $output);

        $this->assertTrue($report->fresh()->is_overdue);

        $inboxItem = InboxItem::where('user_id', $this->secretary->id)->first();
        $this->assertNotNull($inboxItem);
        $this->assertEquals('SYSTEM', $inboxItem->type);
        $this->assertEquals($report->id, $inboxItem->report_id);
        $this->assertStringContainsString('overdue', strtolower($inboxItem->message));
    }

    public function test_calculate_report_overdue_is_idempotent(): void
    {
        $project = Project::factory()->create([
            'division_id' => $this->division->id,
            'lead_researcher_id' => $this->researcher->id,
        ]);

        Report::factory()->create([
            'project_id' => $project->id,
            'submitted_by' => $this->researcher->id,
            'status' => 'PENDING',
            'submitted_at' => now()->subDays(10),
            'is_overdue' => false,
        ]);

        Artisan::call('reports:calculate-overdue');
        $firstOutput = Artisan::output();

        Artisan::call('reports:calculate-overdue');
        $secondOutput = Artisan::output();

        $this->assertStringContainsString('Reports marked as overdue: 1', $firstOutput);
        $this->assertStringContainsString('Reports marked as overdue: 0', $secondOutput);
    }

    public function test_calculate_report_overdue_ignores_recent_pending(): void
    {
        $project = Project::factory()->create([
            'division_id' => $this->division->id,
            'lead_researcher_id' => $this->researcher->id,
        ]);

        Report::factory()->create([
            'project_id' => $project->id,
            'submitted_by' => $this->researcher->id,
            'status' => 'PENDING',
            'submitted_at' => now()->subDays(2),
            'is_overdue' => false,
        ]);

        Artisan::call('reports:calculate-overdue');
        $output = Artisan::output();
        $this->assertStringContainsString('Reports marked as overdue: 0', $output);
    }

    public function test_generate_deadline_alerts_with_no_publications(): void
    {
        $exitCode = Artisan::call('alerts:generate-deadline');

        $this->assertEquals(0, $exitCode);
        $output = Artisan::output();
        $this->assertStringContainsString('Deadline alerts generated: 0', $output);
    }

    public function test_generate_deadline_alerts_creates_alerts(): void
    {
        $project = Project::factory()->create([
            'division_id' => $this->division->id,
            'lead_researcher_id' => $this->researcher->id,
        ]);

        $publication = Publication::factory()->create([
            'submitted_by_id' => $this->researcher->id,
            'linked_project_id' => $project->id,
            'status' => 'IN_REVISION',
            'revision_due_date' => now()->addDays(30),
        ]);

        Artisan::call('alerts:generate-deadline');
        $output = Artisan::output();

        $this->assertStringContainsString('Deadline alerts generated:', $output);

        $managementAlerts = InboxItem::where('user_id', $this->management->id)
            ->where('type', 'SYSTEM')
            ->get();
        $this->assertCount(1, $managementAlerts);
        $this->assertStringContainsString($publication->title, $managementAlerts->first()->message);

        $submitterAlerts = InboxItem::where('user_id', $this->researcher->id)
            ->where('type', 'SYSTEM')
            ->get();
        $this->assertCount(1, $submitterAlerts);
    }

    public function test_generate_deadline_alerts_skips_future_and_past_dates(): void
    {
        $project = Project::factory()->create([
            'division_id' => $this->division->id,
            'lead_researcher_id' => $this->researcher->id,
        ]);

        Publication::factory()->create([
            'submitted_by_id' => $this->researcher->id,
            'linked_project_id' => $project->id,
            'status' => 'IN_REVISION',
            'revision_due_date' => now()->addDays(90),
        ]);

        Publication::factory()->create([
            'submitted_by_id' => $this->researcher->id,
            'linked_project_id' => $project->id,
            'status' => 'IN_REVISION',
            'revision_due_date' => now()->subDays(5),
        ]);

        Artisan::call('alerts:generate-deadline');
        $output = Artisan::output();
        $this->assertStringContainsString('Deadline alerts generated: 0', $output);
    }

    public function test_commands_are_registered(): void
    {
        $exitCode = Artisan::call('list');
        $output = Artisan::output();

        $this->assertStringContainsString('reports:calculate-overdue', $output);
        $this->assertStringContainsString('alerts:generate-deadline', $output);
    }

    public function test_schedule_registration(): void
    {
        $this->assertTrue(app()->bound('Illuminate\Console\Scheduling\Schedule'));

        $schedule = app('Illuminate\Console\Scheduling\Schedule');
        $events = $schedule->events();

        $commands = collect($events)->map(fn ($e) => $e->command)->filter()->values();

        $this->assertTrue(
            $commands->contains(fn ($cmd) => str_contains($cmd, 'reports:calculate-overdue')),
            'reports:calculate-overdue not found in schedule'
        );

        $this->assertTrue(
            $commands->contains(fn ($cmd) => str_contains($cmd, 'alerts:generate-deadline')),
            'alerts:generate-deadline not found in schedule'
        );
    }
}
