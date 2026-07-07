<?php

namespace App\Actions\Report;

use App\Models\Report;
use Illuminate\Http\Request;

class SaveDraftAction
{
    public function execute(Request $request): Report
    {
        $data = [
            'submitted_by' => $request->user()->id,
            'status' => 'DRAFT',
            'period_start' => $request->input('period_start') ?? now()->toDateString(),
            'period_end' => $request->input('period_end') ?? now()->addDay()->toDateString(),
            'narrative_summary' => $request->input('narrative_summary') ?? '',
        ];

        if ($request->filled('project_id')) {
            $data['project_id'] = $request->input('project_id');
        }
        if ($request->filled('type')) {
            $data['type'] = $request->input('type');
        }

        return Report::create($data);
    }
}
