<?php

namespace App\Listeners;

use App\Events\ReportApproved;
use App\Events\ReportEscalated;
use App\Events\ReportReturned;
use App\Models\InboxItem;
use App\Models\User;
use App\Notifications\ReportStatusChangedNotification;
use Illuminate\Support\Facades\Notification;

class SendReportStatusChangedNotification
{
    public function handle(ReportApproved|ReportReturned|ReportEscalated $event): void
    {
        $submitter = User::find($event->report->submitted_by);

        if ($submitter) {
            $actionText = match (true) {
                $event instanceof ReportApproved => 'approved',
                $event instanceof ReportReturned => 'returned for revision',
                $event instanceof ReportEscalated => 'escalated',
                default => 'updated',
            };

            Notification::send($submitter, new ReportStatusChangedNotification($event->report));

            InboxItem::create([
                'user_id' => $submitter->id,
                'sender_id' => null,
                'type' => 'REPORT_UPDATE',
                'subject' => "Report {$actionText}",
                'message' => "Your {$event->report->type} report has been {$actionText}.",
                'report_id' => $event->report->id,
            ]);
        }

        if ($event instanceof ReportEscalated) {
            $managementUsers = User::where('role', 'MANAGEMENT')->get();

            Notification::send($managementUsers, new ReportStatusChangedNotification($event->report));

            foreach ($managementUsers as $user) {
                InboxItem::create([
                    'user_id' => $user->id,
                    'sender_id' => null,
                    'type' => 'REPORT_UPDATE',
                    'subject' => 'Report escalated',
                    'message' => "A {$event->report->type} report has been escalated.",
                    'report_id' => $event->report->id,
                ]);
            }
        }
    }
}
