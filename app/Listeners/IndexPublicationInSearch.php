<?php

namespace App\Listeners;

use App\Events\PublicationCreated;
use App\Jobs\SyncDocumentIndex;

class IndexPublicationInSearch
{
    /**
     * Handle the event.
     */
    public function handle(PublicationCreated $event): void
    {
        // Load documents associated with this publication
        $publication = $event->publication->load('documents');

        foreach ($publication->documents as $document) {
            // SyncDocumentIndex receives a Document instance as expected
            SyncDocumentIndex::dispatch($document);
        }
    }
}