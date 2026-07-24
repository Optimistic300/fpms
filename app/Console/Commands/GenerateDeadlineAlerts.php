<?php

namespace App\Console\Commands;

use App\Models\Publication;
use App\Models\User;
use App\Services\InboxService;
use Illuminate\Console\Command;

class GenerateDeadlineAlerts extends Command
{
    protected $signature = 'alerts:generate-deadline';

    protected $description = 'Generate inbox alerts for upcoming revision deadlines';

    public function handle(InboxService $inboxService): int
    {
        $publications = Publication::with('submitter')
            ->where('status', 'IN_REVISION')
            ->where('revision_due_date', '<=', now()->addDays(60))
            ->where('revision_due_date', '>=', now())
            ->get();

        $alertsGenerated = 0;

        foreach ($publications as $publication) {
            $daysRemaining = (int) now()->diffInDays($publication->revision_due_date);
            $dueDate = $publication->revision_due_date->format('Y-m-d');
            $message = "Revision deadline approaching: '{$publication->title}' due on {$dueDate} ({$daysRemaining} days remaining).";

            $managementUsers = User::where('role', 'MANAGEMENT')->get();

            foreach ($managementUsers as $manager) {
                $inboxService->createSystemAlert(
                    $manager,
                    "Revision Deadline Approaching",
                    $message,
                );
                $alertsGenerated++;
            }

            if ($publication->submitter) {
                $inboxService->createSystemAlert(
                    $publication->submitter,
                    "Revision Deadline Approaching",
                    $message,
                );
                $alertsGenerated++;
            }
        }

        $this->info("Deadline alerts generated: {$alertsGenerated}");

        return Command::SUCCESS;
    }
}
