<?php

namespace App\Http\Resources;

class PublicStatsResource extends CamelCaseResource
{
    protected function resourceToArray($request): array
    {
        return [
            'activeProjects' => $this->resource['active_projects'],
            'libraryDocuments' => $this->resource['library_documents'],
            'divisionsConnected' => $this->resource['divisions_connected'],
        ];
    }
}
