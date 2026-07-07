<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('publications', function (Blueprint $table) {
            $table->id();
            $table->string('title', 500);
            $table->text('authors');
            $table->string('type');
            $table->string('status');
            $table->string('journal_name')->nullable();
            $table->foreignId('linked_project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->string('doi')->nullable();
            $table->string('manuscript_file_path', 500)->nullable();
            $table->foreignId('submitted_by_id')->constrained('users')->cascadeOnDelete();
            $table->string('student_name')->nullable();
            $table->string('supervisor')->nullable();
            $table->string('degree_programme')->nullable();
            $table->date('submission_date')->nullable();
            $table->date('revision_due_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('publications');
    }
};
