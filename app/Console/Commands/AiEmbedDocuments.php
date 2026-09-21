<?php

namespace App\Console\Commands;

use App\Services\GeminiClient;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AiEmbedDocuments extends Command
{
    protected $signature = 'ai:embed-documents';
    protected $description = 'Generate pgvector embeddings for published documents missing one';

    public function handle(GeminiClient $client): int
    {
        $rows = DB::select(
            "SELECT d.id, dt.content
             FROM documents d
             JOIN document_texts dt ON dt.document_id = d.id
             LEFT JOIN document_embeddings de ON de.document_id = d.id
             WHERE d.published = true AND de.id IS NULL"
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
