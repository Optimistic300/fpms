<?php

namespace App\Notifications;

use App\Models\Report;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ReportStatusChangedNotification extends Notification
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
        $actionText = match ($this->report->status) {
            'APPROVED' => 'approved',
            'RETURNED' => 'returned',
            'ESCALATED' => 'escalated',
            default => 'updated',
        };

        return [
            'type' => 'report_status_changed',
            'report_id' => $this->report->id,
            'report_type' => $this->report->type,
            'project_id' => $this->report->project_id,
            'status' => $this->report->status,
            'message' => "Your {$this->report->type} report has been {$actionText}.",
        ];
    }
}
