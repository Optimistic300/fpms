<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Contracts\AiRetrievalInterface;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Collection;

/**
 * AI Query Controller
 * 
 * Handles AI assistant queries via the /api/ai/query endpoint.
 */
class AiController extends Controller
{
    /**
     * The AI retrieval service.
     */
    protected AiRetrievalInterface $retrieval;

    /**
     * Constructor.
     */
    public function __construct(AiRetrievalInterface $retrieval)
    {
        $this->retrieval = $retrieval;
    }

    /**
     * Handle an AI query request.
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function query(Request $request): JsonResponse
    {
        // Log the incoming request
        Log::info('AI Controller: Received query request', [
            'query' => $request->input('query'),
            'conversationHistory_count' => count($request->input('conversationHistory', [])),
            'user_id' => optional($request->user())->id ?? 'guest',
        ]);

        // Validate the request
        $request->validate([
            'query' => ['required', 'string', 'max:1000'],
            'conversationHistory' => ['sometimes', 'array'],
            'conversationHistory.*.role' => ['sometimes', 'string', 'in:user,assistant'],
            'conversationHistory.*.content' => ['sometimes', 'string'],
        ]);

        try {
            // Perform the retrieval
            Log::info('AI Controller: Calling retrieval service');
            $results = $this->retrieval->query(
                $request->input('query'),
                $request->input('conversationHistory', [])
            );
            Log::info('AI Controller: Retrieval service returned results', [
                'results_count' => $results->count() ?? 0,
            ]);

            // Check if we have results
            if ($results->isEmpty()) {
                // No results found - return canAnswer: false
                Log::info('AI Controller: No results found, returning canAnswer: false');
                return response()->json([
                    'query' => $request->input('query'),
                    'standalone_query' => $request->input('query'), // In passages mode, no rewriting
                    'can_answer' => false,
                    'answer' => null,
                    'citations' => [],
                    'notice' => config('ai.notice', 'This is an AI-powered feature. Responses may be inaccurate or incomplete.'),
                ]);
            }

            // Get the AI mode from config
            $mode = config('ai.mode', 'passages');
            Log::info('AI Controller: AI mode is '.$mode);

            if ($mode === 'generative') {
                // For now, we'll just return the passages since we don't have the LLM client implemented yet
                // In a full implementation, we would call the LLM client to synthesize an answer
                // For this implementation, we'll fall back to passages mode
                Log::warning('AI Controller: Generative mode requested but falling back to passages (LLM not implemented)');
                $mode = 'passages';
            }

            if ($mode === 'passages') {
                // Format the results as passages with citations
                Log::info('AI Controller: Formatting results as passages');
                $citations = $results->map(function ($chunk, $key) {
                    return [
                        'id' => $chunk->id,
                        'document_id' => $chunk->document_id,
                        'chunk_index' => $chunk->chunk_index,
                        'content' => $chunk->content,
                        'locator' => $chunk->locator,
                        'page_number' => $chunk->page_number,
                        'document_title' => $chunk->title ?? null,
                        'document_author' => $chunk->author_name ?? null,
                        'document_division' => $chunk->division ?? null,
                        'document_type' => $chunk->file_type ?? null,
                        'score' => round((float) $chunk->combined_score, 4),
                    ];
                });

                // Apply citation verification if enabled
                if (config('ai.verify_quotes', true)) {
                    // For now, we'll just return the citations as-is
                    // In a full implementation, we would verify that the answer is supported by the citations
                    // Since we're in passages mode and not generating an answer, verification is less critical
                }

                // Format the response according to the API spec
                Log::info('AI Controller: Returning passages response with '.$citations->count().' citations');
                return response()->json([
                    'query' => $request->input('query'),
                    'standalone_query' => $request->input('query'), // No rewriting in passages mode
                    'can_answer' => true,
                    'answer' => null, // In passages mode, we don't generate an answer
                    'citations' => $citations->values()->all(),
                    'notice' => config('ai.notice', 'This is an AI-powered feature. Responses may be inaccurate or incomplete.'),
                ]);
            }

            // Fallback (should not reach here)
            Log::warning('AI Controller: Reached fallback case, mode was: '.$mode);
            return response()->json([
                'query' => $request->input('query'),
                'standalone_query' => $request->input('query'),
                'can_answer' => false,
                'answer' => null,
                'citations' => [],
                'notice' => config('ai.notice', 'This is an AI-powered feature. Responses may be inaccurate or incomplete.'),
            ], 500);
        } catch (\Throwable $e) {
            // Log the error (in a real app, we'd use Laravel's logging)
            Log::error('AI Controller: Exception occurred', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            // For now, we'll return a 503 Service Unavailable as per the spec
            // which indicates a temporary inability to process the request
            return response()->json([
                'error' => 'AI service temporarily unavailable',
            ], 503);
        }
    }
}