<?php

namespace Tests\Unit;

use App\Http\Resources\BaseResource;
use Illuminate\Pagination\LengthAwarePaginator;
use PHPUnit\Framework\TestCase;

class CamelCaseResourceTest extends TestCase
{
    public function test_base_resource_paginated_format(): void
    {
        $items = collect([['id' => 1], ['id' => 2]]);
        $paginator = new LengthAwarePaginator($items, 10, 2, 1);

        $result = BaseResource::paginated($paginator, $items);

        $this->assertArrayHasKey('data', $result);
        $this->assertArrayHasKey('meta', $result);
        $this->assertSame(1, $result['meta']['currentPage']);
        $this->assertSame(5, $result['meta']['lastPage']);
        $this->assertSame(2, $result['meta']['perPage']);
        $this->assertSame(10, $result['meta']['total']);
    }
}
