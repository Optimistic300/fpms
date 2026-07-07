<?php

namespace Tests\Unit;

use App\Contracts\AiQueryResult;
use App\Contracts\AiRetrievalInterface;
use App\Contracts\FileStorageInterface;
use App\Contracts\ReportRepositoryInterface;
use App\Services\AiAssistantService;
use App\Services\FileStorageService;
use App\Repositories\ReportRepository;
use Illuminate\Pagination\LengthAwarePaginator;
use Tests\TestCase;

class BindingsTest extends TestCase
{
    public function test_file_storage_interface_bound_in_container(): void
    {
        $instance = app(FileStorageInterface::class);
        $this->assertInstanceOf(FileStorageService::class, $instance);
    }

    public function test_ai_retrieval_interface_bound_in_container(): void
    {
        $instance = app(AiRetrievalInterface::class);
        $this->assertInstanceOf(AiAssistantService::class, $instance);
    }

    public function test_report_repository_interface_bound_in_container(): void
    {
        $instance = app(ReportRepositoryInterface::class);
        $this->assertInstanceOf(ReportRepository::class, $instance);
    }

    public function test_ai_query_result_dto(): void
    {
        $result = new AiQueryResult(
            canAnswer: true,
            answer: 'The sky is blue.',
            citations: ['source-1'],
            followUpPrompts: ['Why?'],
        );

        $this->assertTrue($result->canAnswer);
        $this->assertSame('The sky is blue.', $result->answer);
        $this->assertCount(1, $result->citations);
        $this->assertCount(1, $result->followUpPrompts);
    }

    public function test_pagination_meta_helper(): void
    {
        $items = collect([['id' => 1]]);
        $paginator = new LengthAwarePaginator($items, 25, 10, 2);

        $meta = pagination_meta($paginator);

        $this->assertSame(2, $meta['currentPage']);
        $this->assertSame(3, $meta['lastPage']);
        $this->assertSame(10, $meta['perPage']);
        $this->assertSame(25, $meta['total']);
    }
}
