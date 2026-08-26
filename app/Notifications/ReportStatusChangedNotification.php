<?php

namespace App\Notifications;

use App\Models\Report;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
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
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $actionText = match ($this->report->status) {
            'APPROVED' => 'approved',
            'RETURNED' => 'returned for revision',
            'ESCALATED' => 'escalated to Management',
            default => 'updated',
        };

        $project = $this->report->project;
        $mail = (new MailMessage)
            ->subject("Your {$this->report->type} report has been {$actionText}")
            ->line("Your {$this->report->type} report for \"{$project->title}\" has been {$actionText}.");

        if ($this->report->comment) {
            $mail->line("Comment: \"{$this->report->comment}\"");
        }

        if ($this->report->status === 'RETURNED') {
            $mail->action('Resubmit Report', url('/reports'));
        } elseif ($this->report->status === 'APPROVED') {
            $mail->line('The report has been approved and will be published to the Library.');
        }

        return $mail;
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
