<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Contracts\AiRetrievalInterface;
use App\Contracts\EmbedderInterface;
use App\Services\GeminiEmbedder;
use App\Services\HybridRetrieval;
use App\Services\HybridSearchRetrieval;

class AiServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Bind the embedder interface to the Gemini implementation
        $this->app->singleton(EmbedderInterface::class, function ($app) {
            return new GeminiEmbedder();
        });

        // Bind the hybrid retrieval service (which uses the embedder)
        $this->app->singleton(HybridRetrieval::class, function ($app) {
            return new HybridRetrieval($app->make(EmbedderInterface::class));
        });

        // Bind the AI retrieval interface to our hybrid search retrieval
        $this->app->singleton(AiRetrievalInterface::class, function ($app) {
            return new HybridSearchRetrieval($app->make(HybridRetrieval::class));
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}