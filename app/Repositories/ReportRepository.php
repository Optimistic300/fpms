<?php

namespace App\Repositories;

use App\Contracts\ReportRepositoryInterface;
use App\Models\Report;
use Illuminate\Pagination\LengthAwarePaginator;

class ReportRepository implements ReportRepositoryInterface
{
    public function findPendingQueue(): LengthAwarePaginator
    {
        return Report::with(['project', 'submitter', 'project.division'])
            ->where('status', 'PENDING')
            ->orderBy('created_at', 'desc')
            ->paginate(20);
    }

    public function findOverdue(): LengthAwarePaginator
    {
        return Report::with(['project', 'submitter', 'project.division'])
            ->where('status', 'PENDING')
            ->where(function ($q) {
                $q->whereNull('submitted_at')
                    ->orWhere('submitted_at', '<', now()->subDays(30));
            })
            ->orderBy('created_at', 'asc')
            ->paginate(20);
    }

    public function getPaginated(array $filters, int $perPage, string $sortBy, string $sortDirection): LengthAwarePaginator
    {
        $query = Report::with(['project', 'submitter', 'project.division']);

        if (isset($filters['projectId'])) {
            $query->where('project_id', $filters['projectId']);
        }

        if (isset($filters['owner']) && $filters['owner'] === 'me') {
            $query->where('submitted_by', $filters['ownerId']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (isset($filters['submittedBy'])) {
            $query->where('submitted_by', $filters['submittedBy']);
        }

        if (isset($filters['division'])) {
            $query->whereHas('project', fn($q) => $q->where('division_id', $filters['division']));
        }

        if (isset($filters['scopingRole']) && isset($filters['scopingUserId'])) {
            $role = $filters['scopingRole'];
            $userId = $filters['scopingUserId'];
            $divisionId = $filters['scopingDivisionId'] ?? null;

            if (in_array($role, ['RESEARCHER', 'STUDENT'])) {
                $query->where('submitted_by', $userId);
            } elseif ($role === 'DIVISION_HEAD') {
                $query->whereHas('project', fn($q) => $q->where('division_id', $divisionId));
            }
        }

        $sortColumn = match ($sortBy) {
            'submittedAt' => 'submitted_at',
            'type' => 'type',
            default => 'created_at',
        };

        return $query->orderBy($sortColumn, $sortDirection)->paginate($perPage);
    }

    public function statsForSecretary(int $userId): array
    {
        return [
            'overdue' => Report::where('status', 'PENDING')
                ->where(function ($q) {
                    $q->whereNull('submitted_at')
                        ->orWhere('submitted_at', '<', now()->subDays(30));
                })
                ->count(),
            'pending' => Report::where('status', 'PENDING')->count(),
            'approvedThisQuarter' => Report::where('status', 'APPROVED')
                ->where('submitted_at', '>=', now()->startOfQuarter())
                ->count(),
            'returned' => Report::where('status', 'RETURNED')->count(),
        ];
    }
}
