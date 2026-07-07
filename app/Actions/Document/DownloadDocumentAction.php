<?php

namespace App\Actions\Document;

use App\Contracts\FileStorageInterface;
use App\Models\Document;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DownloadDocumentAction
{
    public function __construct(
        private FileStorageInterface $storage
    ) {}

    public function execute(Document $document): StreamedResponse
    {
        if (!Storage::disk('local')->exists($document->file_path)) {
            abort(404, 'File not found.');
        }

        return $this->storage->get($document->file_path);
    }
}
