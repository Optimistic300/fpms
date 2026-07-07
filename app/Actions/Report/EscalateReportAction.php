<?php

namespace App\Actions\Report;

use App\Events\ReportEscalated;
use App\Models\Report;
use App\Models\ReportComment;
use Illuminate\Http\Request;

class EscalateReportAction
{
    public function execute(Request $request, Report $report): Report
    {
        if ($report->status !== 'PENDING') {
            abort(422, 'Only pending reports can be escalated.');
        }

        $comment = $request->input('comment');
        if (empty($comment)) {
            abort(422, 'Comment is required when escalating a report.');
        }

        $report->update([
            'status' => 'ESCALATED',
            'reviewed_by' => $request->user()->id,
            'comment' => $comment,
        ]);

        ReportComment::create([
            'report_id' => $report->id,
            'user_id' => $request->user()->id,
            'comment' => $comment,
        ]);

        ReportEscalated::dispatch($report);

        return $report;
    }
}
