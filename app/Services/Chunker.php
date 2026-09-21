<?php

namespace App\Services;

/**
 * Chunker service for splitting text into chunks.
 * 
 * Implements sentence-aware, multibyte-safe chunking with overlap.
 * 
 * Target ~1,800 characters (~450 tokens) with ~250 characters of overlap.
 */
class Chunker
{
    /**
     * Split text into chunks.
     * 
     * @param string $text The text to split
     * @param int $max Maximum chunk size in characters (default: 1800)
     * @param int $overlap Overlap size in characters (default: 250)
     * @return array<string> Array of text chunks
     */
    public function split(string $text, int $max = 1800, int $overlap = 250): array
    {
        // Handle empty text
        if (trim($text) === '') {
            return [];
        }

        $chunks = [];
        $buf = '';

        // Split by sentence boundaries (multibyte safe)
        $sentences = preg_split('/(?<=[.!?])\s+/u', $text, -1, PREG_SPLIT_NO_EMPTY);

        foreach ($sentences as $sentence) {
            // If adding this sentence would exceed the max size, store the current buffer and start a new one
            if ($buf !== '' && mb_strlen($buf) + mb_strlen($sentence) > $max) {
                $chunks[] = $buf;
                // Start new buffer with overlap from the end of the current buffer
                $buf = mb_substr($buf, -$overlap) . ' ' . $sentence;
            } else {
                // Add sentence to buffer
                $buf = trim($buf . ' ' . $sentence);
            }
        }

        // Add the last buffer if it's not empty
        if ($buf !== '') {
            $chunks[] = $buf;
        }

        // Handle the case where a single sentence is longer than $max
        // We need to hard-split on whitespace as a safety net
        $finalChunks = [];
        foreach ($chunks as $chunk) {
            if (mb_strlen($chunk) > $max) {
                // Hard split the chunk on whitespace
                $words = preg_split('/\s+/u', $chunk, -1, PREG_SPLIT_NO_EMPTY);
                $current = '';
                foreach ($words as $word) {
                    if (mb_strlen($current) + mb_strlen($word) > $max) {
                        if ($current !== '') {
                            $finalChunks[] = $current;
                        }
                        $current = $word;
                    } else {
                        $current = trim($current . ' ' . $word);
                    }
                }
                if ($current !== '') {
                    $finalChunks[] = $current;
                }
            } else {
                $finalChunks[] = $chunk;
            }
        }

        return $finalChunks;
    }
}