<?php

namespace App\Actions\Activity;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Response;

class ExportActivitiesCsvAction
{
    public function execute(Builder $query): Response
    {
        $activities = $query->get();

        $csv = "Date,Project Title,Type,Description,Notes,Document Count\n";
        foreach ($activities as $a) {
            $projectTitle = str_replace('"', '""', (string) ($a->project?->title ?? ''));
            $description = str_replace('"', '""', (string) $a->description);
            $notes = str_replace('"', '""', (string) ($a->notes ?? ''));
            $csv .= "{$a->date},{$projectTitle},{$a->type},{$description},{$notes},{$a->documents->count()}\n";
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="activities.csv"',
        ]);
    }
}
