<?php

namespace App\Listeners;

use App\Events\PublicationCreated;
use App\Jobs\SyncDocumentIndex;
use Illuminate\Support\Facades\Log;

class IndexPublicationInSearch
{
    /**
     * Handle the event.
     */
    public function handle(PublicationCreated $event): void
    {

        Log::info('Dispatching SyncDocumentIndex', [
            'publication_id' => $event->publication->id,
            'document_id' => $event->publication->document_id ?? null,
        ]);
        // Load documents associated with this publication
        $publication = $event->publication->load('documents');

        foreach ($publication->documents as $document) {
            // Dispatch index job for each attached Document model
            SyncDocumentIndex::dispatch($document);
        }
    }
}