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
                Log::info('AI Controller: No results found, returning canAnswer: false');
                return response()->json([
                    'query' => $request->input('query'),
                    'standalone_query' => $request->input('query'),
                    'can_answer' => false,
                    'answer' => 'I could not find any relevant documents for your query.',
                    'citations' => [],
                    'notice' => config('ai.notice', 'This is an AI-powered feature. Responses may be inaccurate or incomplete.'),
                ]);
            }

            // Get the AI mode from config
            $mode = config('ai.mode', 'passages');
            Log::info('AI Controller: AI mode is '.$mode);

            if ($mode === 'generative') {
                // Fallback to passages mode until LLM integration is ready
                Log::warning('AI Controller: Generative mode requested but falling back to passages (LLM not implemented)');
                $mode = 'passages';
            }

            if ($mode === 'passages') {
                // Format the results as passages with citations
                Log::info('AI Controller: Formatting results as passages');
                $citations = $results->map(function ($chunk) {
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
                })->values();

                // Formulate answer from the top passage excerpt instead of returning null
                $topCitation = $citations->first();
                $answer = $topCitation['content'] ?? 'Found relevant legal citations in the library database.';

                Log::info('AI Controller: Returning passages response with '.$citations->count().' citations');
                return response()->json([
                    'query' => $request->input('query'),
                    'standalone_query' => $request->input('query'),
                    'can_answer' => true,
                    'answer' => $answer,
                    'citations' => $citations->all(),
                    'notice' => config('ai.notice', 'This is an AI-powered feature. Responses may be inaccurate or incomplete.'),
                ]);
            }

            // Fallback
            Log::warning('AI Controller: Reached fallback case, mode was: '.$mode);
            return response()->json([
                'query' => $request->input('query'),
                'standalone_query' => $request->input('query'),
                'can_answer' => false,
                'answer' => 'Unable to process the query mode.',
                'citations' => [],
                'notice' => config('ai.notice', 'This is an AI-powered feature. Responses may be inaccurate or incomplete.'),
            ], 500);

        } catch (\Throwable $e) {
            Log::error('AI Controller: Exception occurred', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'error' => 'AI service temporarily unavailable',
            ], 503);
        }
    }
}