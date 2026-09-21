<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_texts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained()->cascadeOnDelete()->unique();
            $table->longText('content');
            $table->timestamps();

            // Laravel's fullText() schema builder has no Postgres support at
            // all (no compileFullText() in PostgresGrammar), so it can only
            // be used on MySQL here. AiAssistantService queries this column
            // via to_tsvector()/plainto_tsquery() on Postgres, so give it a
            // matching GIN index there instead.
            if (DB::getDriverName() === 'mysql') {
                $table->fullText('content');
            }
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement(
                "CREATE INDEX document_texts_content_fulltext ON document_texts USING GIN (to_tsvector('english', content))"
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('document_texts');
    }
};
