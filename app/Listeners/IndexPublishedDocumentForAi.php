<?php

namespace App\Listeners;

use App\Jobs\SyncDocumentIndex;
use App\Models\Document;
use Illuminate\Contracts\Queue\ShouldQueue;

class IndexPublishedDocumentForAi implements ShouldQueue
{
    use \Illuminate\Foundation\Bus\Dispatchable;
    use \Illuminate\Queue\InteractsWithQueue;
    use \Illuminate\Queue\SerializesModels;

    public function __construct()
    {
        //
    }

    public function handle(Document $document): void
    {
        if ($document->wasChanged(['published', 'file_path', 'title', 'division', 'file_type'])) {
            $document->update([
                'index_status' => 'pending'
            ], ['quiet' => true]); // Avoid re-triggering

            SyncDocumentIndex::dispatchSync($document);
        }
    }
}