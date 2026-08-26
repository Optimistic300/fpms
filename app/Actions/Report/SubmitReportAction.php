<?php

namespace App\Actions\Report;

use App\Events\ReportSubmitted;
use App\Models\Report;
use App\Models\ReportComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SubmitReportAction
{
    public function execute(Request $request): Report
    {
        $version = 1;
        $parentReportId = null;

        if ($request->filled('resubmit')) {
            $parentReport = Report::findOrFail($request->input('resubmit'));
            $version = $parentReport->version + 1;
            $parentReportId = $parentReport->id;
        }

        $filePath = null;
        if ($request->filled('file')) {
            $filePath = $this->storeBase64File($request->input('file'));
        }

        $report = Report::create([
            'project_id' => $request->input('project_id'),
            'submitted_by' => $request->user()->id,
            'type' => $request->input('type'),
            'period_start' => $request->input('period_start'),
            'period_end' => $request->input('period_end'),
            'narrative_summary' => $request->input('narrative_summary'),
            'file_path' => $filePath,
            'status' => 'PENDING',
            'parent_report_id' => $parentReportId,
            'version' => $version,
            'submitted_at' => now(),
        ]);

        ReportComment::create([
            'report_id' => $report->id,
            'user_id' => $request->user()->id,
            'comment' => 'SUBMITTED',
        ]);

        ReportSubmitted::dispatch($report);

        return $report;
    }

    private function storeBase64File(string $base64): string
    {
        $decoded = base64_decode($base64);
        $filename = 'reports/' . uniqid() . '.pdf';

        Storage::disk('local')->put($filename, $decoded);

        return $filename;
    }
}
