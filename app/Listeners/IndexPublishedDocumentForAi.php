<?php

namespace App\Listeners;

use App\Events\DocumentPublished;
use App\Jobs\IndexDocumentForAi;

class IndexPublishedDocumentForAi
{
    public function handle(DocumentPublished $event): void
    {
        IndexDocumentForAi::dispatch($event->document);
    }
}
