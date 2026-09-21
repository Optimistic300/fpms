<?php

namespace App\Services;

use App\Contracts\EmbedderInterface;
use Illuminate\Support\Facades\Http;

/**
 * Gemini Embedder implementation using Google's Gemini API.
 */
class GeminiEmbedder implements EmbedderInterface
{
    /**
     * The Gemini API key.
     */
    protected string $apiKey;

    /**
     * The base URL for the Gemini API.
     */
    protected string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

    /**
     * The model to use for embeddings.
     */
    protected string $model;

    /**
     * The dimensionality of the embeddings produced by the model.
     */
    protected int $dimension = 768;

    /**
     * Maximum number of texts to embed in a single API request.
     */
    protected int $batchSize = 25;

    /**
     * Constructor.
     */
    public function __construct()
    {
        $this->apiKey = config('services.gemini.key');
        
        if (!$this->apiKey) {
            throw new \RuntimeException('GEMINI_API_KEY not configured in services.php');
        }

        // Default to gemini-embedding-2, or read from config if set
        $this->model = config('services.gemini.embedding_model', 'gemini-embedding-2');
    }

    /**
     * Embed an array of document texts.
     * 
     * @param array<string> $texts
     * @return array<float[]>
     */
    public function embedDocuments(array $texts): array
    {
        if (empty($texts)) {
            return [];
        }

        $embeddings = [];
        $batches = array_chunk($texts, $this->batchSize);
        
        foreach ($batches as $batch) {
            $batchEmbeddings = $this->embedBatch($batch, 'RETRIEVAL_DOCUMENT');
            $embeddings = array_merge($embeddings, $batchEmbeddings);
            
            // Throttle between batches to respect rate limits
            usleep(100000); // 100ms
        }
        
        return $embeddings;
    }

    /**
     * Embed a single query text.
     * 
     * @param string $text
     * @return float[]
     */
    public function embedQuery(string $text): array
    {
        if (trim($text) === '') {
            return [];
        }

        $result = $this->embedBatch([$text], 'RETRIEVAL_QUERY');
        return $result[0] ?? [];
    }

    /**
     * Get the model identifier.
     * 
     * @return string
     */
    public function modelId(): string
    {
        return $this->model . ':' . $this->dimension;
    }

    /**
     * Get the embedding dimension.
     * 
     * @return int
     */
    public function getDimension(): int
    {
        return $this->dimension;
    }

    /**
     * Embed a batch of texts using batchEmbedContents endpoint.
     * 
     * @param array<string> $texts
     * @param string $taskType Either 'RETRIEVAL_DOCUMENT' or 'RETRIEVAL_QUERY'
     * @return array<float[]>
     */
    protected function embedBatch(array $texts, string $taskType): array
    {
        if (empty($texts)) {
            return [];
        }

        // Format each request item for the batch request
        $requests = array_map(function (string $text) use ($taskType) {
            return [
                'model' => 'models/' . $this->model,
                'content' => [
                    'parts' => [
                        ['text' => $text]
                    ]
                ],
                'taskType' => $taskType,
                'outputDimensionality' => $this->dimension,
            ];
        }, $texts);

        $endpoint = sprintf(
            '%s/models/%s:batchEmbedContents?key=%s', 
            $this->baseUrl, 
            $this->model, 
            $this->apiKey
        );

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->post($endpoint, [
            'requests' => $requests,
        ]);

        if ($response->failed()) {
            if ($response->status() === 429) {
                throw new \RuntimeException('Gemini API rate limit exceeded', 429);
            }
            
            throw new \RuntimeException('Gemini API error (' . $response->status() . '): ' . $response->body());
        }

        $data = $response->json();
        
        if (!isset($data['embeddings']) || !is_array($data['embeddings'])) {
            throw new \RuntimeException('Unexpected response format from Gemini API: ' . $response->body());
        }

        
        return array_map(fn ($emb) => $this->fit($emb['values'] ?? []), $data['embeddings']);
    }


    /**
 * Ensure a vector matches the configured dimension.
 *
 * Gemini embeddings are truncatable, so if the API returns more values than we
 * asked for, keep the first N and re-normalize to unit length.
 */
    protected function fit(array $v): array
    {
        $n = count($v);

        if ($n < $this->dimension) {
            throw new \RuntimeException(
                "Gemini returned {$n} dimensions, expected {$this->dimension}"
            );
        }

        if ($n === $this->dimension) {
            return $v;
        }

        $v = array_slice($v, 0, $this->dimension);
        $norm = sqrt(array_sum(array_map(fn ($x) => $x * $x, $v)));

        return $norm > 0 ? array_map(fn ($x) => $x / $norm, $v) : $v;
    }
}