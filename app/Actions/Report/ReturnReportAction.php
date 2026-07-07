<?php

namespace App\Actions\Report;

use App\Events\ReportReturned;
use App\Models\Report;
use App\Models\ReportComment;
use Illuminate\Http\Request;

class ReturnReportAction
{
    public function execute(Request $request, Report $report): Report
    {
        if ($report->status !== 'PENDING') {
            abort(422, 'Only pending reports can be returned.');
        }

        $comment = $request->input('comment');
        if (empty($comment)) {
            abort(422, 'Comment is required when returning a report.');
        }

        $report->update([
            'status' => 'RETURNED',
            'reviewed_by' => $request->user()->id,
            'comment' => $comment,
        ]);

        ReportComment::create([
            'report_id' => $report->id,
            'user_id' => $request->user()->id,
            'comment' => $comment,
        ]);

        ReportReturned::dispatch($report);

        return $report;
    }
}
