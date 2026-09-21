<?php

namespace App\Observers;

use App\Models\DocumentChunk;

/**
 * Document Chunk Observer
 * 
 * Handles lifecycle events for document chunks.
 * 
 * Note: In our implementation, we don't actually need this observer
 * because we handle indexing lifecycle at the document level.
 * The DocumentObserver handles unsearching chunks when documents are deleted.
 * This observer exists for completeness and potential future use.
 */
class DocumentChunkObserver
{
    /**
     * Handle the document chunk "saved" event.
     * 
     * @param  \App\Models\DocumentChunk  $chunk
     * @return void
     */
    public function saved(DocumentChunk $chunk): void
    {
        // No special handling needed on save
        // The indexing status is managed at the document level
    }

    /**
     * Handle the document chunk "deleted" event.
     * 
     * @param  \App\Models\DocumentChunk  $chunk
     * @return void
     */
    public function deleted(DocumentChunk $chunk): void
    {
        // No special handling needed on delete
        // The document-level observer handles cleaning up chunks
    }
}