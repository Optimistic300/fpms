<?php

namespace App\Observers;

use App\Jobs\SyncDocumentIndex;
use App\Models\Document;

/**
 * Document Observer
 * 
 * Handles indexing lifecycle events for documents.
 * 
 * This observer ensures that document chunks are properly indexed
 * when documents are published, updated, or deleted.
 */
class DocumentObserver
{
    /**
     * Handle the document "saved" event.
     * 
     * When a document is saved and certain fields have changed,
     * we queue a job to sync its index status.
     * 
     * @param  \App\Models\Document  $document
     * @return void
     */
    public function saved(Document $document): void
    {
        // Check if the document was changed in ways that require re-indexing
        if ($document->wasChanged(['published', 'file_path', 'title', 'division', 'file_type', 'allow_external_ai'])) {
            // Update index status to pending to avoid re-triggering the observer
            // during the sync process
            $document->update(['index_status' => 'pending']);
            
            // Dispatch the sync job
            SyncDocumentIndex::dispatch($document);
        }
    }

    /**
     * Handle the document "deleting" event.
     * 
     * Before a document is deleted (including via cascading deletes),
     * we remove its chunks from the search index.
     * 
     * @param  \App\Models\Document  $document
     * @return void
     */
    public function deleting(Document $document): void
    {
        // Remove chunks from search index before the document is deleted
        // This prevents orphaned index entries when using database cascades
        $document->chunks()->unsearchable();
    }
}