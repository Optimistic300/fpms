<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('division_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lead_researcher_id')->constrained('users')->cascadeOnDelete();
            $table->string('funding_type');
            $table->string('funding_source')->nullable();
            $table->string('research_area')->nullable();
            $table->string('location')->nullable();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->string('status');
            $table->tinyInteger('progress')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
