<?php

namespace App\Console\Commands;

use App\Models\Document;
use App\Models\DocumentChunk;
use App\Jobs\SyncDocumentIndex;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AiReconcileIndex extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'ai:reconcile-index';

    /**
     * The console command description.
     */
    protected $description = 'Reconcile published documents with search index';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting AI index reconciliation...');

        // Get published document IDs from MySQL
        $publishedDocIds = Document::where('published', true)->pluck('id')->toArray();

        // Get document IDs that have chunks in the search index
        $indexedDocIds = DocumentChunk::distinct()->pluck('document_id')->toArray();

        // Find documents that are published but not indexed
        $notIndexed = array_diff($publishedDocIds, $indexedDocIds);
        
        // Find documents that are indexed but not published (or deleted)
        $shouldNotBeIndexed = array_diff($indexedDocIds, $publishedDocIds);

        // Re-index documents that are published but not in search index
        foreach ($notIndexed as $docId) {
            $document = Document::find($docId);
            if ($document) {
                $this->info("Re-indexing document: {$document->filename}");
                SyncDocumentIndex::dispatch($document);
            }
        }

        // Remove from search index documents that are not published
        foreach ($shouldNotBeIndexed as $docId) {
            $document = Document::find($docId);
            if ($document) {
                $this->info("Removing unpublished document from index: {$document->filename}");
                $document->chunks()->unsearchable();
                $document->chunks()->delete();
                $document->update([
                    'index_status' => 'not_indexed',
                    'index_error' => null,
                ]);
            }
        }

        $this->info('AI index reconciliation completed.');
        return 0;
    }
}
