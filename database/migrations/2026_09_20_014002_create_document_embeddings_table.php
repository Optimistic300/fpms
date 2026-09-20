<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create pgvector extension if it doesn't exists (PostgreSQL only)
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('CREATE EXTENSION IF NOT EXISTS vector;');
        }

        Schema::create('document_embeddings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });

        // Add vector column for embeddings (PostgreSQL with pgvector)
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE document_embeddings ADD COLUMN embedding vector(1536);');
            
            // Create index for vector similarity search
            DB::statement('CREATE INDEX document_embeddings_embedding_idx ON document_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop vector column and index if they exist (PostgreSQL with pgvector)
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS document_embeddings_embedding_idx;');
            DB::statement('ALTER TABLE document_embeddings DROP COLUMN IF EXISTS embedding;');
        }
        Schema::dropIfExists('document_embeddings');
        
        // Drop pgvector extension if no other tables use it
        // Note: We're being conservative and not dropping the extension
        // as it might be used by other parts of the application
    }
};
