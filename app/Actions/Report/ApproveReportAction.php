<?php

namespace App\Actions\Report;

use App\Events\ReportApproved;
use App\Models\Report;
use App\Models\ReportComment;
use Illuminate\Http\Request;

class ApproveReportAction
{
    public function execute(Request $request, Report $report): Report
    {
        if ($report->status !== 'PENDING') {
            abort(422, 'Only pending reports can be approved.');
        }

        $report->update([
            'status' => 'APPROVED',
            'reviewed_by' => $request->user()->id,
            'comment' => $request->input('comment'),
        ]);

        ReportComment::create([
            'report_id' => $report->id,
            'user_id' => $request->user()->id,
            'comment' => $request->input('comment') ?? 'APPROVED',
        ]);

        ReportApproved::dispatch($report);

        return $report;
    }
}
