<?php

namespace App\Jobs;

use App\Models\Document;
use App\Models\DocumentText;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class IndexDocumentForAi implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Document $document,
    ) {}

    public function handle(): void
    {
        $disk = config('filesystems.default');

        if (!Storage::disk($disk)->exists($this->document->file_path)) {
            Log::warning('Document file not found for indexing', [
                'document_id' => $this->document->id,
                'path' => $this->document->file_path,
            ]);
            return;
        }

        $extension = strtolower(pathinfo($this->document->filename, PATHINFO_EXTENSION));
        $content = '';

        try {
            $content = match ($extension) {
                'pdf' => $this->extractPdf(),
                'docx' => $this->extractDocx(),
                'xlsx' => $this->extractXlsx(),
                default => '',
            };
        } catch (\Throwable $e) {
            Log::warning('Text extraction failed for document', [
                'document_id' => $this->document->id,
                'error' => $e->getMessage(),
            ]);
        }

        DocumentText::updateOrCreate(
            ['document_id' => $this->document->id],
            ['content' => $content],
        );
    }

    private function extractPdf(): string
    {
        $parser = new \Smalot\PdfParser\Parser();
        $pdf = $parser->parseContent(
            Storage::disk(config('filesystems.default'))->get($this->document->file_path)
        );
        return $pdf->getText();
    }

    private function extractDocx(): string
    {
        $tempPath = $this->tempCopy();
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
        return trim($text);
    }

    private function extractXlsx(): string
    {
        $tempPath = $this->tempCopy();
        $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($tempPath);
        $text = '';
        foreach ($spreadsheet->getWorksheetIterator() as $worksheet) {
            foreach ($worksheet->getRowIterator() as $row) {
                $cells = [];
                foreach ($row->getCellIterator() as $cell) {
                    $cells[] = $cell->getCalculatedValue();
                }
                $text .= implode("\t", $cells) . "\n";
            }
        }
        @unlink($tempPath);
        return trim($text);
    }

    private function tempCopy(): string
    {
        $tempPath = tempnam(sys_get_temp_dir(), 'fpms_') . '.' . pathinfo($this->document->filename, PATHINFO_EXTENSION);
        $contents = Storage::disk(config('filesystems.default'))->get($this->document->file_path);
        file_put_contents($tempPath, $contents);
        return $tempPath;
    }
}
