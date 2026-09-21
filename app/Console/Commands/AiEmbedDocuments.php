<?php

namespace App\Console\Commands;

use App\Jobs\SyncDocumentIndex;
use App\Models\Document;
use App\Services\GeminiClient;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AiEmbedDocuments extends Command
{
    protected $signature = 'ai:embed-documents';
    protected $description = 'Chunk (if needed) and generate pgvector embeddings for published documents';

    public function handle(GeminiClient $client): int
    {
        // Backfill chunks for published documents that were never indexed
        // (the indexing listener used to be queued with no worker to run it).
        Document::where('published', true)
            ->whereDoesntHave('chunks')
            ->each(function (Document $doc) {
                SyncDocumentIndex::dispatchSync($doc);
                $this->info("Chunked document {$doc->id}");
            });

        $rows = DB::select(
            "SELECT d.id, string_agg(dc.content, ' ' ORDER BY dc.chunk_index) as content
             FROM documents d
             JOIN document_chunks dc ON dc.document_id = d.id
             LEFT JOIN document_embeddings de ON de.document_id = d.id
             WHERE d.published = true AND de.id IS NULL
             GROUP BY d.id"
        );

        foreach ($rows as $row) {
            try {
                $vector = '[' . implode(',', $client->embed($row->content)) . ']';
                DB::statement(
                    'INSERT INTO document_embeddings (document_id, embedding, created_at, updated_at)
                     VALUES (?, ?::vector, NOW(), NOW())',
                    [$row->id, $vector]
                );
                $this->info("Embedded document {$row->id}");
            } catch (\Throwable $e) {
                $this->error("Failed document {$row->id}: {$e->getMessage()}");
            }
        }

        return self::SUCCESS;
    }
}
