<?php

namespace App\Observers;

use App\Models\Document;
use App\Jobs\SyncDocumentIndex;

class DocumentObserver
{
    /**
     * Handle the Document "saved" event.
     */
    public function saved(Document $document): void
    {
        if ($document->wasChanged(['published', 'file_path', 'title', 'division', 'file_type'])) {
            $document->update([
                'index_status' => 'pending'
            ], ['quiet' => true]); // quietly, to avoid re-triggering

            SyncDocumentIndex::dispatch($document);
        }
    }

    /**
     * Handle the Document "deleting" event.
     */
    public function deleting(Document $document): void
    {
        // Remove from search BEFORE the cascade removes the rows
        $document->chunks()->unsearchable();
    }
}