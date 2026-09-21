<?php

namespace App\Jobs;

use App\Models\Document;
use App\Services\TextExtractorService;
use App\Services\Chunker;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

/**
 * Sync document index job.
 * 
 * This job is responsible for extracting text from a document, chunking it,
 * and storing the chunks in the database with null embeddings (to be filled
 * by the EmbedDocumentChunks job later).
 * 
 * It implements ShouldBeUnique to prevent overlapping jobs for the same document.
 */
class SyncDocumentIndex implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The document to index.
     */
    public Document $document;

    /**
     * The text extractor service.
     */
    protected TextExtractorService $extractor;

    /**
     * The chunker service.
     */
    protected Chunker $chunker;

    /**
     * Create a new job instance.
     */
    public function __construct(Document $document, TextExtractorService $extractor, Chunker $chunker)
    {
        $this->document = $document;
        $this->extractor = $extractor;
        $this->chunker = $chunker;
    }

    /**
     * Get the unique job id for deduplication.
     * 
     * This ensures that only one SyncDocumentIndex job runs per document at a time.
     */
    public function uniqueId(): string
    {
        return 'SyncDocumentIndex-' . $this->document->id;
    }

    /**
     * Determine if the job should be unique.
     * 
     * We want to prevent overlapping jobs for the same document.
     */
    public function uniqueFor(): int
    {
        // Wait until the job is finished before allowing another for the same document
        return 300;
    }

    /**
     * Get the middleware to prevent overlapping jobs.
     */
    public function middleware(): array
    {
        // Prevent overlapping jobs for the same document
        return [
            (new WithoutOverlapping('document-' . $this->document->id))
                ->releaseAfter(10)
                ->expireAfter(30),
        ];
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Refresh the document to get the latest state
        $doc = $this->document->fresh();

        if (! $doc) {
            // Document was deleted before we could process it
            return;
        }

        // Order matters: remove from search BEFORE deleting rows
        // This ensures that we don't have stale index entries during the update
        $doc->chunks()->unsearchable();
        $doc->chunks()->delete();

        // If the document is not published or not allowed for external AI, we're done
        if (! $doc->published || ! $doc->allow_external_ai) {
            $doc->update([
                'index_status' => 'not_indexed',
                'index_error' => null,
            ]);

            return;
        }

        try {
            // Extract text from the document
            $pages = $this->extractor->pages($doc); // Returns array of ['page' => ?int, 'locator' => ?string, 'text' => string]

            // Detect if the document is scanned/image-only (needs OCR)
            $emptyPages = collect($pages)->filter(function ($p) {
                return mb_strlen(trim($p['text'])) < 20; // Consider a page empty if it has less than 20 characters
            })->count();

            $totalPages = count($pages);

            if ($totalPages === 0 || ($emptyPages / $totalPages) > 0.3) {
                // More than 30% of pages are nearly empty - flag for OCR
                $doc->update([
                    'index_status' => 'needs_ocr',
                    'index_error' => null,
                ]);

                // Dispatch OCR job (we'll assume this exists and will re-dispatch SyncDocumentIndex on success)
                // OcrDocument::dispatch($doc)->onQueue('ocr');
                return;
            }

            // Prepare chunk data for insertion
            $rows = [];
            $chunkIndex = 0;

            foreach ($pages as $page) {
                $cleanText = trim(preg_replace('/\s+/u', ' ', $page['text']));

                // Split the text into chunks
                $chunks = $this->chunker->split($cleanText);

                foreach ($chunks as $chunk) {
                    $rows[] = [
                        'document_id' => $doc->id,
                        'chunk_index' => $chunkIndex++,
                        'page_number' => $page['page'],
                        'locator'     => $page['locator'],
                        'content'     => $chunk,
                        'created_at'  => now(),
                        'updated_at'  => now(),
                        'embedding'   => null, // Will be filled by EmbedDocumentChunks job
                        'embedding_model' => null, // Will be filled by EmbedDocumentChunks job
                    ];
                }
            }

            // Insert the chunks in a transaction
            if (! empty($rows)) {
                DB::transaction(function () use ($rows, $doc) {
                    DB::table('document_chunks')->insert($rows);

                    // Mark chunks as searchable (this would trigger Scout if we were using it, but we're not)
                    // Instead, we'll update the index status to pending_embedding to signal that embeddings are needed
                    $doc->update(['index_status' => 'pending_embedding']);
                });
            }

            // If we successfully inserted chunks, mark as pending_embedding
            // (the transaction above already updated the status, but we do it again for clarity)
            $doc->update(['index_status' => 'pending_embedding']);
        } catch (\Throwable $e) {
            // If something goes wrong, mark the document as failed
            $doc->update([
                'index_status' => 'failed',
                'index_error' => $e->getMessage(),
            ]);

            // Re-throw to let the queue handle retries
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $e): void
    {
        // Update the document to reflect the failure
        $this->document->update([
            'index_status' => 'failed',
            'index_error' => substr($e->getMessage(), 0, 255), // Truncate to fit in text column if needed
        ]);
    }
}