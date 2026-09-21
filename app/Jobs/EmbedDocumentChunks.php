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

/**
 * Embed document chunks job.
 * 
 * Generates embeddings for document chunks that have null
 * embeddings or outdated embedding models.
 */
class EmbedDocumentChunks implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Optional target document. If null, processes all pending chunks.
     */
    public ?Document $document;

    /**
     * Create a new job instance.
     */
    public function __construct(?Document $document = null)
    {
        $this->document = $document;
    }

    /**
     * Get the unique job id for deduplication.
     */
    public function uniqueId(): string
    {
        return 'EmbedDocumentChunks-' . ($this->document ? 'doc-' . $this->document->id : 'global');
    }

    /**
     * Determine how long the unique lock is held (in seconds).
     */
    public function uniqueFor(): int
    {
        return 600;
    }

    /**
     * Get the middleware to prevent overlapping jobs.
     */
    public function middleware(): array
    {
        $lockKey = $this->document 
            ? 'embed_document_' . $this->document->id 
            : 'embed_document_chunks_global';

        return [
            (new WithoutOverlapping($lockKey))
                ->releaseAfter(10)
                ->expireAfter(30),
        ];
    }

    /**
     * Execute the job.
     */
    public function handle(GeminiEmbedder $embedder): void
    {
        $batchSize = config('ai.embedder_batch_size', 25);
        $modelId = $embedder->modelId();

        $hasMoreChunks = true;

        while ($hasMoreChunks) {
            // Query chunks needing embedding
            $query = DB::table('document_chunks')
                ->join('documents', 'document_chunks.document_id', '=', 'documents.id')
                ->where(function ($q) use ($modelId) {
                    $q->whereNull('document_chunks.embedding')
                      ->orWhere('document_chunks.embedding_model', '<>', $modelId);
                })
                ->where('documents.published', true)
                ->where('documents.allow_external_ai', true);

            // Scope query if target document is set
            if ($this->document) {
                $query->where('documents.id', $this->document->id);
            }

            $chunks = $query->select('document_chunks.*')
                ->limit($batchSize)
                ->get();

            if ($chunks->isEmpty()) {
                $hasMoreChunks = false;
                continue;
            }

            try {
                // Extract text content for embedding
                $texts = $chunks->pluck('content')->toArray();

                // Generate embeddings for the batch
                $embeddings = $embedder->embedDocuments($texts);

                // Update chunks with embedding vectors
                foreach ($chunks as $index => $chunk) {
                    $embeddingValue = is_array($embeddings[$index])
                        ? json_encode($embeddings[$index])
                        : $embeddings[$index];

                    DB::table('document_chunks')
                        ->where('id', $chunk->id)
                        ->update([
                            'embedding'       => $embeddingValue,
                            'embedding_model' => $modelId,
                            'updated_at'      => now(),
                        ]);
                }

                // Rate limiting pause between batches
                usleep(500000); // 500ms

            } catch (\Throwable $e) {
                // Re-throw to trigger queue retry mechanisms
                throw $e;
            }
        }

        // Transition documents from 'pending_embedding' to 'indexed' once all chunks are done
        $statusQuery = DB::table('documents')
            ->where('index_status', 'pending_embedding');

        if ($this->document) {
            $statusQuery->where('id', $this->document->id);
        }

        $statusQuery->whereNotExists(function ($subQuery) use ($modelId) {
            $subQuery->select(DB::raw(1))
                ->from('document_chunks')
                ->whereRaw('document_chunks.document_id = documents.id')
                ->where(function ($q) use ($modelId) {
                    $q->whereNull('document_chunks.embedding')
                      ->orWhere('document_chunks.embedding_model', '<>', $modelId);
                });
        })->update([
            'index_status' => 'indexed',
            'index_error'  => null,
        ]);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $e): void
    {
        if ($this->document) {
            $this->document->fresh()?->update([
                'index_status' => 'failed',
                'index_error'  => 'Embedding failed: ' . substr($e->getMessage(), 0, 200),
            ]);
        }
    }
}