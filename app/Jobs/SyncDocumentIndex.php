<?php

namespace App\Jobs;

use App\Models\Document;
use App\Services\Chunker;
use App\Services\TextExtractorService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;


/**
 * Sync document index job.
 * 
 * This job extracts text from a document, chunks it, and stores the chunks
 * in the database with null embeddings to be processed by EmbedDocumentChunks.
 */
class SyncDocumentIndex implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The document to index.
     */
    public Document $document;

    /**
     * Create a new job instance.
     */
    public function __construct(Document $document)
    {
        $this->document = $document;
    }

    /**
     * Get the unique job id for deduplication.
     */
    public function uniqueId(): string
    {
        return 'SyncDocumentIndex-' . $this->document->id;
    }

    /**
     * Lock duration for unique job prevention.
     */
    public function uniqueFor(): int
    {
        return 300;
    }

    /**
     * Middleware to prevent overlapping executions.
     */
    public function middleware(): array
    {
        return [
            (new WithoutOverlapping('document-' . $this->document->id))
                ->releaseAfter(10)
                ->expireAfter(30),
        ];
    }

    /**
     * Execute the job.
     */
    public function handle(TextExtractorService $extractor, Chunker $chunker): void
    {
        Log::info('SyncDocumentIndex: Starting indexing process', [
            'document_id' => $this->document->id,
            'file_name'   => $this->document->original_name ?? $this->document->file_path,
        ]);

        // Refresh the document to get the latest state
        $doc = $this->document->fresh();

        if (! $doc) {
            Log::warning('SyncDocumentIndex: Document missing or deleted before processing', [
                'document_id' => $this->document->id,
            ]);
            return;
        }

        // Clean up previous chunks
        if (method_exists($doc->chunks(), 'unsearchable')) {
            $doc->chunks()->unsearchable();
        }
        $deletedChunks = $doc->chunks()->delete();

        Log::info('SyncDocumentIndex: Cleared old chunks', [
            'document_id'    => $doc->id,
            'deleted_count'  => $deletedChunks,
        ]);

        // If not published or external AI is disallowed, mark as not indexed and stop
        if (! $doc->published || ! $doc->allow_external_ai) {
            Log::info('SyncDocumentIndex: Skipping indexing (not published or AI disabled)', [
                'document_id'        => $doc->id,
                'published'          => $doc->published,
                'allow_external_ai' => $doc->allow_external_ai,
            ]);

            $doc->update([
                'index_status' => 'not_indexed',
                'index_error'  => null,
            ]);

            return;
        }

        try {
            // Extract text pages
            Log::info('SyncDocumentIndex: Extracting text', ['document_id' => $doc->id]);
            $pages = $extractor->pages($doc);

            // Detect scanned / image-only PDFs
            $emptyPages = collect($pages)->filter(function ($p) {
                return mb_strlen(trim($p['text'] ?? '')) < 20;
            })->count();

            $totalPages = count($pages);

            if ($totalPages === 0 || ($emptyPages / $totalPages) > 0.3) {
                Log::warning('SyncDocumentIndex: Document requires OCR', [
                    'document_id'  => $doc->id,
                    'total_pages'  => $totalPages,
                    'empty_pages'  => $emptyPages,
                    'empty_ratio'  => $totalPages > 0 ? round($emptyPages / $totalPages, 2) : 0,
                ]);

                $doc->update([
                    'index_status' => 'needs_ocr',
                    'index_error'  => null,
                ]);

                // OcrDocument::dispatch($doc)->onQueue('ocr');
                return;
            }

            // Prepare chunk rows
            $rows = [];
            $chunkIndex = 0;

            foreach ($pages as $page) {
                $cleanText = trim(preg_replace('/\s+/u', ' ', $page['text']));
                $chunks = $chunker->split($cleanText);

                foreach ($chunks as $chunk) {
                    $rows[] = [
                        'document_id'     => $doc->id,
                        'chunk_index'     => $chunkIndex++,
                        'page_number'     => $page['page'],
                        'locator'         => $page['locator'],
                        'content'         => $chunk,
                        'created_at'      => now(),
                        'updated_at'      => now(),
                        'embedding'       => null,
                        'embedding_model' => null,
                    ];
                }
            }

            // Batch insert chunks inside a transaction
            if (! empty($rows)) {
                DB::transaction(function () use ($rows, $doc) {
                    // Chunk inserts to avoid SQL placeholder limits
                    foreach (array_chunk($rows, 100) as $batch) {
                        DB::table('document_chunks')->insert($batch);
                    }

                    $doc->update([
                        'index_status' => 'pending_embedding',
                        'index_error'  => null,
                    ]);
                });

                Log::info('SyncDocumentIndex: Successfully chunked and stored text', [
                    'document_id'  => $doc->id,
                    'total_pages'  => $totalPages,
                    'total_chunks' => count($rows),
                ]);

                // Dispatch the embedding job
                EmbedDocumentChunks::dispatch($doc);
            } else {
                Log::warning('SyncDocumentIndex: No text content found to chunk', [
                    'document_id' => $doc->id,
                ]);

                $doc->update([
                    'index_status' => 'not_indexed',
                    'index_error'  => 'No text content found to chunk.',
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('SyncDocumentIndex: Extraction or chunking failed', [
                'document_id' => $doc->id,
                'error'       => $e->getMessage(),
                'exception'   => $e,
            ]);

            $doc->update([
                'index_status' => 'failed',
                'index_error'  => substr($e->getMessage(), 0, 255),
            ]);

            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $e): void
    {
        Log::error('SyncDocumentIndex: Job failed permanently', [
            'document_id' => $this->document->id,
            'error'       => $e->getMessage(),
            'exception'   => $e,
        ]);

        $this->document->fresh()?->update([
            'index_status' => 'failed',
            'index_error'  => substr($e->getMessage(), 0, 255),
        ]);
    }
}