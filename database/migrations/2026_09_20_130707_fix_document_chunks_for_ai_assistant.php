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
        // Add embedding column for vector storage if it doesn't exist
        if (!Schema::hasColumn('document_chunks', 'embedding')) {
            DB::statement('ALTER TABLE document_chunks ADD COLUMN embedding vector(768)');
        }
        
        // Add embedding_model column to track which model generated the embedding
        if (!Schema::hasColumn('document_chunks', 'embedding_model')) {
            Schema::table('document_chunks', function (Blueprint $table) {
                $table->string('embedding_model', 64)->nullable();
            });
        }
        
        // Add tsv column for full-text search if it doesn't exist
        if (!Schema::hasColumn('document_chunks', 'tsv')) {
            Schema::table('document_chunks', function (Blueprint $table) {
                $table->tsvector('tsv')->nullable();
                
                // Create a trigger to keep tsv column updated
                DB::unprepared("
                    CREATE OR REPLACE FUNCTION update_document_chunks_tsv()
                    RETURNS TRIGGER AS $$
                    BEGIN
                        NEW.tsv := to_tsvector('english', COALESCE(NEW.content, ''));
                        RETURN NEW;
                    END;
                    $$ LANGUAGE plpgsql;
                ");
                
                DB::unprepared("
                    DROP TRIGGER IF EXISTS tsvectorupdate ON document_chunks;
                    CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
                    ON document_chunks FOR EACH ROW EXECUTE PROCEDURE update_document_chunks_tsv();
                ");
            });
        }
        
        // Add GIN index for full-text search if it doesn't exist
        if (!Schema::hasIndex('document_chunks', 'document_chunks_tsv_idx')) {
            DB::statement('CREATE INDEX document_chunks_tsv_idx ON document_chunks USING GIN (tsv)');
        }
        
        // Add HNSW index for vector search if it doesn't exist
        // Note: We create it now even if table is empty - it's safe and will be populated as data arrives
        if (!Schema::hasIndex('document_chunks', 'document_chunks_embedding_idx')) {
            DB::statement('CREATE INDEX document_chunks_embedding_idx ON document_chunks USING hnsw (embedding vector_cosine_ops)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop trigger and function
        DB::unprepared("
            DROP TRIGGER IF EXISTS tsvectorupdate ON document_chunks;
            DROP FUNCTION IF EXISTS update_document_chunks_tsv();
        ");
        
        // Drop indexes
        if (Schema::hasIndex('document_chunks', 'document_chunks_tsv_idx')) {
            DB::statement('DROP INDEX IF EXISTS document_chunks_tsv_idx');
        }
        
        if (Schema::hasIndex('document_chunks', 'document_chunks_embedding_idx')) {
            DB::statement('DROP INDEX IF EXISTS document_chunks_embedding_idx');
        }
        
        // Drop columns
        if (Schema::hasColumn('document_chunks', 'tsv')) {
            Schema::table('document_chunks', function (Blueprint $table) {
                $table->dropColumn('tsv');
            });
        }
        
        if (Schema::hasColumn('document_chunks', 'embedding_model')) {
            Schema::table('document_chunks', function (Blueprint $table) {
                $table->dropColumn('embedding_model');
            });
        }
        
        if (Schema::hasColumn('document_chunks', 'embedding')) {
            DB::statement('ALTER TABLE document_chunks DROP COLUMN embedding');
        }
    }
};
