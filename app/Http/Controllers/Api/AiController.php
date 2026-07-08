<?php

namespace App\Http\Controllers\Api;

use App\Contracts\AiRetrievalInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\AiQueryRequest;
use App\Http\Resources\AiResponseResource;
use Illuminate\Http\JsonResponse;

class AiController extends Controller
{
    public function __construct(
        private AiRetrievalInterface $aiRetrieval,
    ) {}

    public function query(AiQueryRequest $request): JsonResponse
    {
        try {
            $result = $this->aiRetrieval->query(
                $request->input('query'),
                $request->input('conversation_history', []),
            );
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'The assistant took too long to respond. Please try again.',
            ], 408);
        }

        return AiResponseResource::make($result)->response();
    }
}
