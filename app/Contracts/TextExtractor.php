<?php

namespace App\Contracts;

use App\Models\Document;

/**
 * Text Extractor Contract.
 * 
 * Defines the contract for extracting text content and pagination/locators from documents.
 */
interface TextExtractor
{
    /**
     * Extract text from a document, returning pages with optional locators.
     * 
     * @param Document $document
     * @return array<int, array{page: int|null, locator: string|null, text: string}>
     */
    public function pages(Document $document): array;
}