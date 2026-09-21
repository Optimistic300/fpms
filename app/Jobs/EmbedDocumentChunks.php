<?php

namespace App\Jobs;

use App\Models\Document;
use App\Services\GeminiEmbedder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

/**
 * Embed document chunks job.
 * 
 * This job is responsible for generating embeddings for document chunks
 * that have null embeddings or outdated embedding models.
 * 
 * It implements ShouldBeUnique to prevent overlapping embedding jobs.
 */
class EmbedDocumentChunks implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The Gemini embedder service.
     */
    protected GeminiEmbedder $embedder;

    /**
     * Create a new job instance.
     */
    public function __construct(GeminiEmbedder $embedder)
    {
        $this->embedder = $embedder;
    }

    /**
     * Get the unique job id for deduplication.
     * 
     * We want only one EmbedDocumentChunks job running at a time to avoid
     * overwhelming the embedding API with concurrent requests.
     */
    public function uniqueId(): string
    {
        return 'EmbedDocumentChunks';
    }

    /**
     * Determine if the job should be unique.
     */
    public function uniqueFor(): int
    {
        // Wait until the job is finished before allowing another embedding job
        return 600;
    }

    /**
     * Get the middleware to prevent overlapping jobs.
     */
    public function middleware(): array
    {
        // Prevent overlapping embedding jobs
        return [
            (new WithoutOverlapping('embed_document_chunks'))
                ->releaseAfter(10)
                ->expireAfter(30),
        ];
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $batchSize = config('ai.embedder_batch_size', 25);
        
        // Process chunks that need embedding (null embedding or outdated model)
        // We use a loop to keep processing batches until there are no more chunks to embed
        $hasMoreChunks = true;
        
        while ($hasMoreChunks) {
            // Get a batch of chunks that need embedding
            $chunks = DB::table('document_chunks')
                ->join('documents', 'document_chunks.document_id', '=', 'documents.id')
                ->where(function ($query) {
                    // Chunks that need embedding: either no embedding yet, or outdated model
                    $query->whereNull('document_chunks.embedding')
                          ->orWhere('document_chunks.embedding_model', '<>', 
                                   app()->make(GeminiEmbedder::class)->modelId());
                })
                ->where('documents.published', true)
                ->where('documents.allow_external_ai', true)
                ->select('document_chunks.*')
                ->limit($batchSize)
                ->get();

            if ($chunks->isEmpty()) {
                $hasMoreChunks = false;
                continue;
            }

            try {
                // Extract just the text content for embedding
                $texts = $chunks->pluck('content')->toArray();
                
                // Generate embeddings for the batch
                $embeddings = $this->embedder->embedDocuments($texts);
                
                // Update each chunk with its embedding and model info
                foreach ($chunks as $index => $chunk) {
                    DB::table('document_chunks')
                        ->where('id', $chunk->id)
                        ->update([
                            'embedding' => $embeddings[$index],
                            'embedding_model' => $this->embedder->modelId(),
                            'updated_at' => now(),
                        ]);
                }
                
                // Simple rate limiting: sleep between batches to respect API limits
                // In a production system, you might want to use Laravel's rate limiter
                // or a more sophisticated queue-based approach with delays.
                usleep(500000); // 500ms between batches
                
            } catch (\Throwable $e) {
                // If we hit a rate limit or other recoverable error, we'll let the job fail
                // and be retried later. For unrecoverable errors, we might want to 
                // mark individual chunks as failed, but for simplicity we'll let the job fail.
                
                // Check if it's a rate limit error (429)
                if ($e->getCode() === 429 || str_contains($e->getMessage(), 'rate limit')) {
                    // Re-throw to trigger retry logic
                    throw $e;
                }
                
                // For other errors, we still want to fail the job so we can investigate
                throw $e;
            }
        }
        
        // After processing all chunks, we need to update documents that were pending_embedding
        // to now be indexed (since their chunks have been embedded)
        DB::table('documents')
            ->where('index_status', 'pending_embedding')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                      ->from('document_chunks')
                      ->whereRaw('document_chunks.document_id = documents.id')
                      ->where(function ($query) {
                          $query->whereNull('document_chunks.embedding')
                                ->orWhere('document_chunks.embedding_model', '<>', 
                                       app()->make(GeminiEmbedder::class)->modelId());
                      });
            })
            ->update(['index_status' => 'indexed']);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $e): void
    {
        // For embedding jobs, we don't have a specific document to update
        // since this job processes chunks across many documents.
        // The individual chunk failures would need to be handled differently
        // if we wanted to track them at the chunk level.
        //
        // For now, we'll rely on the queue's retry mechanism and manual intervention
        // if there are persistent failures.
    }
}