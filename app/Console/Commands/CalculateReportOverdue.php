<?php

namespace App\Console\Commands;

use App\Models\Report;
use App\Models\User;
use App\Services\InboxService;
use Illuminate\Console\Command;

class CalculateReportOverdue extends Command
{
    protected $signature = 'reports:calculate-overdue';

    protected $description = 'Mark reports as overdue when pending for more than 7 days';

    public function handle(InboxService $inboxService): int
    {
        $overdue = Report::where('status', 'PENDING')
            ->where('submitted_at', '<', now()->subDays(7))
            ->where('is_overdue', false)
            ->get();

        $count = 0;

        foreach ($overdue as $report) {
            $report->update(['is_overdue' => true]);

            $daysWaiting = (int) $report->submitted_at->diffInDays(now());
            $projectTitle = $report->project->title;
            $reportTitle = ucfirst(strtolower($report->type)) . ' Report';

            $secretaries = User::where('role', 'SECRETARY')->get();

            foreach ($secretaries as $secretary) {
                $inboxService->createSystemAlert(
                    $secretary,
                    "Report Overdue: {$reportTitle}",
                    "Report '{$reportTitle}' for project '{$projectTitle}' is overdue (submitted {$daysWaiting} days ago).",
                    $report,
                );
            }

            $count++;
        }

        $this->info("Reports marked as overdue: {$count}");

        return Command::SUCCESS;
    }
}
