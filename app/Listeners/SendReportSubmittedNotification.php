<?php

namespace App\Listeners;

use App\Events\ReportSubmitted;
use App\Models\InboxItem;
use App\Models\User;
use App\Notifications\ReportSubmittedNotification;
use Illuminate\Support\Facades\Notification;

class SendReportSubmittedNotification
{
    public function handle(ReportSubmitted $event): void
    {
        $secretaries = User::where('role', 'SECRETARY')->get();

        Notification::send($secretaries, new ReportSubmittedNotification($event->report));

        foreach ($secretaries as $secretary) {
            InboxItem::create([
                'user_id' => $secretary->id,
                'sender_id' => $event->report->submitted_by,
                'type' => 'REPORT_UPDATE',
                'subject' => "New {$event->report->type} report submitted",
                'message' => "A new {$event->report->type} report has been submitted for review.",
                'report_id' => $event->report->id,
            ]);
        }
    }
}
