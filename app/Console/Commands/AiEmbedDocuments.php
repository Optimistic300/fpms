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
        $this->info('ai:embed-documents starting...');

        try {
            $publishedCount = Document::where('published', true)->count();
            $missingChunks = Document::where('published', true)->whereDoesntHave('chunks')->count();
            $this->info("Published documents: {$publishedCount}, missing chunks: {$missingChunks}");

            // Backfill chunks for published documents that were never indexed
            // (the indexing listener used to be queued with no worker to run it).
            Document::where('published', true)
                ->whereDoesntHave('chunks')
                ->each(function (Document $doc) {
                    SyncDocumentIndex::dispatchSync($doc);
                    $doc->refresh();
                    $this->info("Chunked document {$doc->id} (status: {$doc->index_status}, error: " . ($doc->index_error ?? 'none') . ')');
                });

            $rows = DB::select(
                "SELECT d.id, string_agg(dc.content, ' ' ORDER BY dc.chunk_index) as content
                 FROM documents d
                 JOIN document_chunks dc ON dc.document_id = d.id
                 LEFT JOIN document_embeddings de ON de.document_id = d.id
                 WHERE d.published = true AND de.id IS NULL
                 GROUP BY d.id"
            );

            $this->info('Documents ready to embed: ' . count($rows));

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

            $this->info('ai:embed-documents finished.');
        } catch (\Throwable $e) {
            $this->error('ai:embed-documents crashed: ' . $e->getMessage());
            $this->error($e->getTraceAsString());
        }

        return self::SUCCESS;
    }
}
