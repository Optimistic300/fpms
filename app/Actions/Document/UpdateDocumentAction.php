<?php

namespace App\Actions\Document;

use App\Events\DocumentPublished;
use App\Models\Document;

class UpdateDocumentAction
{
    public function execute(Document $document, array $data): Document
    {
        if (isset($data['published'])) {
            $wasPublished = $document->published;
            $document->update(['published' => $data['published']]);

            if ($data['published'] && !$wasPublished) {
                event(new DocumentPublished($document));
            }
        }

        return $document->fresh();
    }
}
