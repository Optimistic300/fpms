<?php

namespace App\Contracts;

use Illuminate\Pagination\LengthAwarePaginator;

interface ReportRepositoryInterface
{
    public function findPendingQueue(): LengthAwarePaginator;

    public function findOverdue(): LengthAwarePaginator;

    public function getPaginated(array $filters, int $perPage, string $sortBy, string $sortDirection): LengthAwarePaginator;

    public function statsForSecretary(int $userId): array;
}
