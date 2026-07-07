<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class ReportResource extends CamelCaseResource
{
    private bool $withHistory = false;

    public function withHistory(bool $value = true): static
    {
        $this->withHistory = $value;
        return $this;
    }

    protected function resourceToArray($request): array
    {
        $report = $this->resource;

        $daysWaiting = $report->submitted_at ? now()->diffInDays($report->submitted_at) : 0;

        $data = [
            'id' => $report->id,
            'report_name' => $report->type . ' Report',
            'project_id' => $report->project_id,
            'project_title' => $report->project?->title,
            'period' => $report->period_start?->toDateString() . ' — ' . $report->period_end?->toDateString(),
            'period_start' => $report->period_start?->toDateString(),
            'period_end' => $report->period_end?->toDateString(),
            'type' => $report->type,
            'status' => $report->status,
            'version' => $report->version,
            'parent_report_id' => $report->parent_report_id,
            'narrative_summary' => $report->narrative_summary,
            'submitted_by' => $report->submitter?->full_name,
            'submitted_by_id' => $report->submitted_by,
            'division' => $report->project?->division?->name,
            'submitted_at' => $report->submitted_at?->toIso8601String(),
            'days_waiting' => $daysWaiting,
            'comment' => $report->comment,
            'file' => $report->file_path ? ['filename' => basename($report->file_path), 'size' => 0] : null,
        ];

        if ($this->withHistory) {
            $history = collect();

            if ($report->relationLoaded('comments')) {
                $history = $report->comments->map(fn ($c) => [
                    'event' => 'COMMENT',
                    'timestamp' => $c->created_at?->toIso8601String(),
                    'user' => $c->user?->full_name,
                    'comment' => $c->comment,
                ]);
            }

            $history->prepend([
                'event' => 'SUBMITTED',
                'timestamp' => $report->submitted_at?->toIso8601String(),
                'user' => $report->submitter?->full_name,
                'comment' => null,
            ]);

            $data['history'] = $history->values();
        }

        return $data;
    }

    public static function collection($resource)
    {
        $collection = parent::collection($resource);
        return $collection;
    }
}
