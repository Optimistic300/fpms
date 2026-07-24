<?php

namespace App\Actions\Document;

use App\Contracts\FileStorageInterface;
use App\Models\Document;

class PreviewDocumentAction
{
    public function __construct(
        private FileStorageInterface $storage
    ) {}

    public function execute(Document $document): array
    {
        $previewUrl = $this->storage->url($document->file_path);
        $inlineSupported = in_array($document->mime_type, [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
        ]);

        return [
            'id' => $document->id,
            'filename' => $document->filename,
            'mimeType' => $document->mime_type,
            'previewUrl' => $previewUrl,
            'inlinePreviewSupported' => $inlineSupported,
        ];
    }
}
