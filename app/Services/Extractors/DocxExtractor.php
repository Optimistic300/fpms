<?php

namespace App\Services\Extractors;

use App\Contracts\TextExtractor;
use PhpOffice\PhpWord\TemplateProcessor;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\Exception\Exception;

/**
 * DOCX Text Extractor
 * 
 * Uses phpoffice/phpword to extract text from Word documents.
 * Note: DOCX doesn't have reliable page numbers, so page = null.
 */
class DocxExtractor implements TextExtractor
{
    /**
     * Extract text from a DOCX document, returning pages.
     * 
     * @param \App\Models\Document $document
     * @return array<int, array{page: int|null, locator: string|null, text: string}>
     */
    public function pages(\App\Models\Document $document): array
    {
        $filePath = storage_path('app/' . $document->file_path);

        // Check if file exists
        if (! file_exists($filePath)) {
            return [];
        }

        try {
            // Load the document
            $phpWord = IOFactory::load($filePath);
            
            // Extract text from all elements
            $text = $phpWord->getText();
            
            // Since DOCX doesn't have reliable page numbers, we return one "page" with null page number
            // In a more sophisticated implementation, we could split by some heuristic
            // but for now we'll treat the whole document as one chunkable unit
            return [
                [
                    'page' => null, // No reliable page numbers in DOCX
                    'locator' => null,
                    'text' => trim($text),
                ]
            ];
        } catch (\Throwable $e) {
            // If extraction fails, return an empty array
            return [];
        }
    }
}