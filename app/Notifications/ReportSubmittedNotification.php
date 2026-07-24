<?php

namespace App\Notifications;

use App\Models\Report;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ReportSubmittedNotification extends Notification
{
    use Queueable;

    public Report $report;

    public function __construct(Report $report)
    {
        $this->report = $report;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'report_submitted',
            'report_id' => $this->report->id,
            'report_type' => $this->report->type,
            'project_id' => $this->report->project_id,
            'submitted_by' => $this->report->submitted_by,
            'message' => "A new {$this->report->type} report has been submitted for review.",
        ];
    }
}
