<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create the pivot table for Document <-> Publication relation
        Schema::create('document_publication', function (Blueprint $table) {
            $table->foreignId('document_id')
                  ->constrained('documents')
                  ->onDelete('cascade');

            $table->foreignId('publication_id')
                  ->constrained('publications')
                  ->onDelete('cascade');

            $table->primary(['document_id', 'publication_id']);
        });

        // 2. Make project_id on documents nullable for standalone publication docs
        Schema::table('documents', function (Blueprint $table) {
            $table->foreignId('project_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_publication');

        Schema::table('documents', function (Blueprint $table) {
            $table->foreignId('project_id')->nullable(false)->change();
        });
    }
};