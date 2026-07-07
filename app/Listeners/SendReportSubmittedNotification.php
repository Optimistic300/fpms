<?php

namespace App\Listeners;

use App\Events\ReportSubmitted;
use App\Models\User;
use App\Notifications\ReportSubmittedNotification;
use Illuminate\Support\Facades\Notification;

class SendReportSubmittedNotification
{
    public function handle(ReportSubmitted $event): void
    {
        $secretaries = User::where('role', 'SECRETARY')->get();

        Notification::send($secretaries, new ReportSubmittedNotification($event->report));
    }
}
