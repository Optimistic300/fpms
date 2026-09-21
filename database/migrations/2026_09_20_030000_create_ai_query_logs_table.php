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
        Schema::create('ai_query_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('query');
            $table->text('standalone_query')->nullable();
            $table->boolean('can_answer');
            $table->json('chunk_ids')->nullable();
            $table->integer('latency_ms')->nullable();
            $table->integer('tokens_in')->nullable();
            $table->integer('tokens_out')->nullable();
            $table->string('feedback')->nullable(); // thumbs up/down
            $table->timestamps();
            
            // Indexes for querying
            $table->index(['user_id', 'created_at']);
            $table->index(['can_answer']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_query_logs');
    }
};