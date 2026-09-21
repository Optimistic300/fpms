<?php

namespace App\Contracts;

/**
 * Interface for embedding text into vector representations.
 * 
 * This interface is designed to be swappable between different embedding providers
 * (Gemini, OpenAI, local models, etc.) while maintaining a consistent contract.
 */
interface EmbedderInterface
{
    /**
     * Embed an array of document texts for storage in the vector database.
     * 
     * @param array<string> $texts Array of text chunks to embed
     * @return array<float[]> Array of embedding vectors (same order as input)
     */
    public function embedDocuments(array $texts): array;

    /**
     * Embed a query text for similarity search against stored documents.
     * 
     * @param string $text Query text to embed
     * @return float[] Embedding vector
     */
    public function embedQuery(string $text): array;

    /**
     * Get the unique identifier for the embedding model being used.
     * 
     * This should include both the model name and dimension to allow
     * detection of when embeddings need to be regenerated due to model changes.
     * 
     * @return string Model identifier (e.g., "gemini-embedding-001:768")
     */
    public function modelId(): string;

    /**
     * Get the dimensionality of the embedding vectors produced by this embedder.
     * 
     * @return int Number of dimensions (should be 768 for Gemini embeddings)
     */
    public function getDimension(): int;
}