<?php

namespace App\Http\Resources;

use App\Http\Resources\Traits\HasMessage;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

abstract class BaseResource extends CamelCaseResource
{
    use HasMessage;

    public static function paginated(LengthAwarePaginator $paginator, mixed $collection): array
    {
        return [
            'data' => $collection,
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'lastPage' => $paginator->lastPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }

    abstract protected function resourceToArray($request): array;
}
