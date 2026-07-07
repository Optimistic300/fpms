<?php

namespace App\Actions\Document;

use App\Contracts\FileStorageInterface;
use App\Models\Document;

class DeleteDocumentAction
{
    public function __construct(
        private FileStorageInterface $storage
    ) {}

    public function execute(Document $document): void
    {
        $this->storage->delete($document->file_path);
        $document->delete();
    }
}
