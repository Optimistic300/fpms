<?php

namespace App\Jobs;

use App\Models\Document;
use App\Models\DocumentChunk;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class SyncDocumentIndex implements ShouldQueue
{
    use Queueable;

    public bool $deleteWhenMissingModels = true;
    public int $tries = 3;
    public int $timeout = 300;

    public function __construct(
        public Document $document,
    ) {}

    public function middleware(): array
    {
        // Never two jobs for the same document at once
        return [(new \Illuminate\Queue\Middleware\WithoutOverlapping($this->document->id))->releaseAfter(30)];
    }

    public function handle(): void
    {
        $doc = $this->document->fresh();
        if (! $doc) {
            return;
        }

        // Scout isn't installed - just clear existing chunks, no search index to update.
        $doc->chunks()->delete();

        if (! $doc->published) {
            $doc->update([
                'index_status' => 'not_indexed',
                'index_error' => null,
            ]);
            return;
        }

        $pages = $this->extractPages($doc);

        // Scanned / image-only detection: flag it, never fail silently
        $empty = collect($pages)->filter(fn ($p) => mb_strlen(trim($p['text'])) < 20)->count();
        if ($pages === [] || $empty / count($pages) > 0.3) {
            $doc->update([
                'index_status' => 'needs_ocr',
                'index_error' => null,
            ]);
            
            // Dispatch OCR job (would need to be implemented)
            // OcrDocument::dispatch($doc)->onQueue('ocr');
            return;
        }

        $rows = [];
        $i = 0;
        foreach ($pages as $p) {
            $clean = trim(preg_replace('/\s+/u', ' ', $p['text']));
            foreach ($this->chunkText($clean) as $chunk) {
                $rows[] = [
                    'document_id' => $doc->id,
                    'chunk_index' => $i++,
                    'page_number' => $p['page'],
                    'locator' => $p['locator'],
                    'content' => $chunk,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        DB::transaction(function () use ($rows, $doc) {
            DocumentChunk::insert($rows);
            $doc->update([
                'index_status' => 'indexed',
                'indexed_at' => now(),
                'index_error' => null,
            ]);
        });
    }

    public function failed(\Throwable $e): void
    {
        $this->document->update([
            'index_status' => 'failed',
            'index_error' => $e->getMessage(),
        ]);
    }

    private function extractPages(Document $doc): array
    {
        $disk = config('filesystems.default');
        $extension = strtolower(pathinfo($doc->filename, PATHINFO_EXTENSION));
        
        try {
            return match ($extension) {
                'pdf' => $this->extractPdfPages($doc, $disk),
                'docx' => $this->extractDocxPages($doc, $disk),
                'xlsx' => $this->extractXlsxPages($doc, $disk),
                default => [],
            };
        } catch (\Throwable $e) {
            Log::warning('Text extraction failed for document', [
                'document_id' => $doc->id,
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    private function extractPdfPages(Document $doc, string $disk): array
    {
        $parser = new \Smalot\PdfParser\Parser();
        $pdf = $parser->parseContent(
            Storage::disk($disk)->get($doc->file_path)
        );
        
        // Get text with layout preservation for better table readability
        $text = $pdf->getText();
        // Split by form feed to get pages
        $rawPages = explode("\f", $text);
        
        $pages = [];
        foreach ($rawPages as $pageIndex => $pageText) {
            if (trim($pageText) !== '') {
                $pages[] = [
                    'page' => $pageIndex + 1,
                    'locator' => null,
                    'text' => $pageText,
                ];
            }
        }
        
        return $pages;
    }

    private function extractDocxPages(Document $doc, string $disk): array
    {
        $tempPath = $this->tempCopy($doc->file_path, $disk);
        $phpWord = \PhpOffice\PhpWord\IOFactory::load($tempPath);
        $text = '';
        
        foreach ($phpWord->getSections() as $section) {
            foreach ($section->getElements() as $element) {
                if (method_exists($element, 'getText')) {
                    $text .= $element->getText() . "\n";
                }
                if (method_exists($element, 'getElements')) {
                    foreach ($element->getElements() as $child) {
                        if (method_exists($child, 'getText')) {
                            $text .= $child->getText() . "\n";
                        }
                    }
                }
            }
        }
        
        @unlink($tempPath);
        
        // For DOCX, we don't have reliable page numbers, so return as one "page"
        return $text !== '' ? [
            [
                'page' => 1,
                'locator' => null,
                'text' => $text,
            ]
        ] : [];
    }

    private function extractXlsxPages(Document $doc, string $disk): array
    {
        $tempPath = $this->tempCopy($doc->file_path, $disk);
        $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($tempPath);
        $pages = [];
        
        $pageNumber = 1;
        foreach ($spreadsheet->getWorksheetIterator() as $worksheet) {
            $text = '';
            $worksheetTitle = $worksheet->getTitle();
            
            foreach ($worksheet->getRowIterator() as $row) {
                $cells = [];
                foreach ($row->getCellIterator() as $cell) {
                    $cells[] = $cell->getCalculatedValue() ?? '';
                }
                $text .= implode("\t", $cells) . "\n";
            }
            
            if (trim($text) !== '') {
                $pages[] = [
                    'page' => $pageNumber,
                    'locator' => "Sheet: {$worksheetTitle}",
                    'text' => $text,
                ];
                $pageNumber++;
            }
        }
        
        @unlink($tempPath);
        return $pages;
    }

    private function tempCopy(string $filePath, string $disk): string
    {
        $tempPath = tempnam(sys_get_temp_dir(), 'fpms_') . '.' . pathinfo($filePath, PATHINFO_EXTENSION);
        $contents = Storage::disk($disk)->get($filePath);
        file_put_contents($tempPath, $contents);
        return $tempPath;
    }

    /**
     * Chunk text into overlapping segments.
     *
     * @param string $text The text to chunk
     * @param int $maxChars Maximum characters per chunk
     * @param int $overlap Overlap between chunks
     * @return array Array of text chunks
     */
    private function chunkText(string $text, int $maxChars = 1800, int $overlap = 250): array
    {
        $chunks = [];
        $buf = '';
        
        // Split by sentence boundaries (period, exclamation, question followed by space)
        foreach (preg_split('/(?<=[.!?])\s+/u', $text, -1, PREG_SPLIT_NO_EMPTY) as $sentence) {
            $sentence = trim($sentence);
            if ($sentence === '') {
                continue;
            }
            
            // If adding this sentence would exceed max length and we have a buffer
            if ($buf !== '' && mb_strlen($buf) + mb_strlen($sentence) > $maxChars) {
                // Save current buffer as a chunk
                $chunks[] = $buf;
                
                // Start new buffer with overlap from end of previous buffer
                $overlapText = mb_substr($buf, -$overlap);
                $buf = trim($overlapText . ' ' . $sentence);
            } else {
                // Add sentence to buffer
                $buf = trim($buf . ' ' . $sentence);
            }
        }
        
        // Don't forget the last buffer
        if ($buf !== '') {
            $chunks[] = $buf;
        }
        
        // Handle case where a single sentence is longer than maxChars
        foreach ($chunks as $index => $chunk) {
            if (mb_strlen($chunk) > $maxChars) {
                // Hard split on whitespace as safety net
                $words = preg_split('/\s+/u', $chunk, -1, PREG_SPLIT_NO_EMPTY);
                $newChunks = [];
                $currentChunk = '';
                
                foreach ($words as $word) {
                    if (mb_strlen($currentChunk . ' ' . $word) > $maxChars && $currentChunk !== '') {
                        $newChunks[] = $trimCurrentChunk = trim($currentChunk);
                        $currentChunk = $word;
                    } else {
                        $currentChunk = trim($currentChunk . ' ' . $word);
                    }
                }
                
                if ($currentChunk !== '') {
                    $newChunks[] = trim($currentChunk);
                }
                
                // Replace the oversized chunk with the new chunks
                $chunks[$index] = array_shift($newChunks);
                // Insert remaining chunks at this position
                array_splice($chunks, $index + 1, 0, $newChunks);
            }
        }
        
        return $chunks;
    }
}