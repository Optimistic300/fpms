<?php

namespace App\Http\Resources;

class DashboardStatsResource extends CamelCaseResource
{
    protected function resourceToArray($request): array
    {
        return [
            'totalProjects' => $this->resource['total_projects'],
            'ongoing' => $this->resource['ongoing'],
            'reportsPending' => $this->resource['reports_pending'],
            'activitiesThisMonth' => $this->resource['activities_this_month'],
        ];
    }
}
