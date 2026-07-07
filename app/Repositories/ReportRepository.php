<?php

namespace App\Repositories;

use App\Contracts\ReportRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class ReportRepository implements ReportRepositoryInterface
{
    public function findPendingQueue(): LengthAwarePaginator
    {
        throw new \RuntimeException('ReportRepository::findPendingQueue() not yet implemented');
    }

    public function findOverdue(): LengthAwarePaginator
    {
        throw new \RuntimeException('ReportRepository::findOverdue() not yet implemented');
    }

    public function statsForSecretary(int $userId): array
    {
        throw new \RuntimeException('ReportRepository::statsForSecretary() not yet implemented');
    }
}
