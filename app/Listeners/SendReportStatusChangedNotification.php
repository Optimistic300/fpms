<?php

namespace App\Listeners;

use App\Events\ReportApproved;
use App\Events\ReportEscalated;
use App\Events\ReportReturned;
use App\Models\Report;
use App\Models\User;
use App\Notifications\ReportStatusChangedNotification;
use Illuminate\Support\Facades\Notification;

class SendReportStatusChangedNotification
{
    public function handle(ReportApproved|ReportReturned|ReportEscalated $event): void
    {
        $submitter = User::find($event->report->submitted_by);

        if ($submitter) {
            Notification::send($submitter, new ReportStatusChangedNotification($event->report));
        }

        if ($event instanceof ReportEscalated) {
            $managementUsers = User::where('role', 'MANAGEMENT')->get();
            Notification::send($managementUsers, new ReportStatusChangedNotification($event->report));
        }
    }
}
