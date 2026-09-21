<?php

namespace App\Services;

use App\Services\Extractors\DocxExtractor;
use App\Services\Extractors\PdfExtractor;
use App\Services\Extractors\XlsxExtractor;
use App\Models\Document;
use Illuminate\Support\Str;

/**
 * Text Extractor service.
 * 
 * This service selects the appropriate extractor based on the document's MIME type or file extension.
 */
class TextExtractorService implements \App\Contracts\TextExtractor
{
    /**
     * The extractors indexed by MIME type.
     */
    protected array $extractors = [];

    /**
     * Constructor.
     */
    public function __construct()
    {
        $this->extractors = [
            'application/pdf' => new PdfExtractor(),
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => new DocxExtractor(),
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => new XlsxExtractor(),
            // Add more MIME types as needed
        ];
    }

    /**
     * Extract text from a document, returning pages with optional locators.
     * 
     * @param \App\Models\Document $document
     * @return array<int, array{page: int|null, locator: string|null, text: string}>
     */
    public function pages(Document $document): array
    {
        // Determine the MIME type
        $mimeType = $document->mime_type;

        // Get the appropriate extractor
        $extractor = $this->extractors[$mimeType] ?? null;

        if (! $extractor) {
            // Fallback: try to guess from file extension
            $ext = Str::lower(pathinfo($document->filename, PATHINFO_EXTENSION));
            switch ($ext) {
                case 'pdf':
                    $extractor = new PdfExtractor();
                    break;
                case 'docx':
                    $extractor = new DocxExtractor();
                    break;
                case 'xlsx':
                    $extractor = new XlsxExtractor();
                    break;
                default:
                    // If we still don't have an extractor, return empty array
                    return [];
            }
        }

        return $extractor->pages($document);
    }
}