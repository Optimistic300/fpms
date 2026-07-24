<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('activity_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('uploaded_by')->constrained('users')->cascadeOnDelete();
            $table->string('filename');
            $table->string('file_path', 500);
            $table->string('mime_type', 100);
            $table->integer('size');
            $table->string('type');
            $table->boolean('published')->default(false);
            $table->timestamps();

            $table->fullText('filename');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
