<?php

namespace App\Services\Extractors;

use App\Services\TextExtractor;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Exception\Exception as PhpSpreadsheetException;

/**
 * XLSX Text Extractor
 * 
 * Uses phpoffice/phpspreadsheet to extract text from Excel documents.
 * One "page" per sheet with locator = "Sheet: {name}".
 */
class XlsxExtractor implements TextExtractor
{
    /**
     * Extract text from an XLSX document, returning pages (one per sheet).
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
            // Load the spreadsheet
            $spreadsheet = IOFactory::load($filePath);
            
            $pages = [];
            $sheetIndex = 0;

            // Iterate over each worksheet
            foreach ($spreadsheet->getWorksheetIterator() as $worksheet) {
                $sheetIndex++;
                $sheetName = $worksheet->getTitle();
                
                // Convert the worksheet to text (we'll iterate through rows)
                $text = '';
                $highestRow = $worksheet->getHighestRow();
                $highestColumn = $worksheet->getHighestColumn();
                $highestColumnIndex = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($highestColumn);
                
                // We'll read row by row and create a text representation
                for ($row = 1; $row <= $highestRow; $row++) {
                    $rowText = [];
                    for ($col = 1; $col <= $highestColumnIndex; $col++) {
                        $cell = $worksheet->getCellByColumnAndRow($col, $row);
                        $cellValue = $cell->getValue();
                        $rowText[] = is_null($cellValue) ? '' : strval($cellValue);
                    }
                    $text .= implode("\t", $rowText) . "\n";
                }
                
                // If the sheet is empty, we might still want to include it? 
                // For now, we include all sheets.
                $pages[] = [
                    'page' => $sheetIndex, // Using sheet index as page number for now
                    'locator' => "Sheet: {$sheetName}",
                    'text' => trim($text),
                ];
            }
            
            return $pages;
        } catch (PhpSpreadsheetException $e) {
            // If extraction fails, return an empty array
            return [];
        } catch (\Throwable $e) {
            // Catch any other exceptions
            return [];
        }
    }
}