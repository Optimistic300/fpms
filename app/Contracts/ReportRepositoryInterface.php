<?php

namespace App\Contracts;

use Illuminate\Pagination\LengthAwarePaginator;

interface ReportRepositoryInterface
{
    public function findPendingQueue(): LengthAwarePaginator;

    public function findOverdue(): LengthAwarePaginator;

    public function statsForSecretary(int $userId): array;
}
