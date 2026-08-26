<?php

namespace App\Jobs;

use App\Contracts\FileStorageInterface;
use App\Models\Document;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Http\UploadedFile;

class ProcessDocumentUpload implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        private UploadedFile $file,
        private int $userId,
        private int $projectId,
        private ?int $activityId,
        private string $documentType,
    ) {}

    public function handle(FileStorageInterface $storage): Document
    {
        $filePath = $storage->store($this->file, 'documents/' . $this->projectId);

        return Document::create([
            'project_id' => $this->projectId,
            'activity_id' => $this->activityId,
            'uploaded_by' => $this->userId,
            'filename' => $this->file->getClientOriginalName(),
            'file_path' => $filePath,
            'mime_type' => $this->file->getMimeType(),
            'size' => $this->file->getSize(),
            'type' => $this->documentType,
            'published' => false,
        ]);
    }
}
