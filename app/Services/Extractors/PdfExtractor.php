<?php

namespace App\Services\Extractors;

use App\Contracts\TextExtractor;
use App\Models\Document;
use Illuminate\Support\Facades\Storage;
use Spatie\PdfToText\Pdf;

/**
 * PDF Text Extractor
 * 
 * Uses spatie/pdf-to-text which requires poppler-utils on the server.
 */
class PdfExtractor implements TextExtractor
{
    /**
     * Extract text from a PDF document, returning pages.
     * 
     * @param Document $document
     * @return array<int, array{page: int|null, locator: string|null, text: string}>
     */
    public function pages(Document $document): array
    {
        // Resolve path via Storage facade or fallback to storage_path
        $filePath = Storage::disk('public')->exists($document->file_path)
            ? Storage::disk('public')->path($document->file_path)
            : storage_path('app/' . $document->file_path);

        // Check if file exists
        if (! file_exists($filePath)) {
            return [];
        }

        try {
            // Extract text with layout mode to keep tables readable
            $text = Pdf::getText($filePath, null, ['layout']);
            
            // Split by form feed to get pages
            $rawPages = explode("\f", $text);
            
            $pages = [];
            foreach ($rawPages as $index => $pageText) {
                $pageNumber = $index + 1; // Page numbers start at 1
                $pages[] = [
                    'page' => $pageNumber,
                    'locator' => null, // PDFs don't have a standard locator like sheet names
                    'text' => trim($pageText),
                ];
            }
            
            return $pages;
        } catch (\Throwable $e) {
            // If extraction fails, return an empty array (the calling job should handle this)
            return [];
        }
    }
}