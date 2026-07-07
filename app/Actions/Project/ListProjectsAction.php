<?php

namespace App\Actions\Project;

use App\Models\Project;
use App\Policies\ProjectPolicy;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

class ListProjectsAction
{
    public function execute(Request $request): LengthAwarePaginator
    {
        $user = $request->user();

        $query = Project::with(['division', 'lead', 'members']);

        if ($request->owner === 'me') {
            $query->where('lead_researcher_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('division')) {
            $query->where('division_id', $request->division);
        }

        if ($request->filled('fundingType')) {
            $query->where('funding_type', $request->fundingType);
        }

        if ($request->filled('researchArea')) {
            $query->where('research_area', 'like', '%' . $request->researchArea . '%');
        }

        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function ($qry) use ($q) {
                $qry->where('title', 'like', "%{$q}%")
                    ->orWhere('research_area', 'like', "%{$q}%")
                    ->orWhereHas('lead', function ($qry2) use ($q) {
                        $qry2->where('full_name', 'like', "%{$q}%");
                    });
            });
        }

        $limit = min((int) $request->limit, 100);

        return $query->orderBy('created_at', 'desc')->paginate($limit);
    }
}
