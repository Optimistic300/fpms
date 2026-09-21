<?php

namespace App\Actions\Publication;

use App\Events\PublicationCreated;
use App\Models\Document;
use App\Models\Publication;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class CreatePublicationAction
{
    public function execute(array $data): Publication
    {
        $data['submitted_by_id'] = auth()->id();

        // Extract uploaded manuscript file before creating Publication
        $manuscriptFile = $data['manuscript_file'] ?? null;
        unset($data['manuscript_file']);

        // 1. Create the publication record
        $publication = Publication::create($data);

        // 2. Handle primary manuscript file and convert to a Document model
        // Inside CreatePublicationAction.php

        if ($manuscriptFile) {
            $filePath = $this->handleFileUpload($manuscriptFile);
            $publication->update(['manuscript_file_path' => $filePath]);

            $fullPath = storage_path('app/public/' . $filePath);
            $fileSize = file_exists($fullPath) ? filesize($fullPath) : 0;

            $document = Document::create([
                'title'             => $publication->title ?: 'Main Manuscript',
                'filename'          => basename($filePath),
                'file_path'         => $filePath,
                'mime_type'         => 'application/pdf',
                'size'              => $fileSize,
                'type'              => 'manuscript',
                'uploaded_by'       => auth()->id(),
                'project_id'        => $publication->linked_project_id ?: null,
                'published'         => true,
                'allow_external_ai' => true,
                'index_status'      => 'not_indexed',
            ]);

            // Attach document to publication via pivot table
            $publication->documents()->attach($document->id);
        }

        // 4. Dispatch event
        event(new PublicationCreated($publication));

        return $publication;
    }

    private function handleFileUpload(mixed $file): string
    {
        if ($file instanceof UploadedFile) {
            return $file->store('publications', 'public');
        }

        $base64 = is_array($file) ? ($file['content'] ?? $file['data'] ?? '') : $file;

        if (empty($base64)) {
            return '';
        }

        $decoded = base64_decode(preg_replace('#^data:[^;]+;base64,#', '', $base64));

        if (strlen($decoded) > 50 * 1024 * 1024) {
            throw new \InvalidArgumentException('File exceeds 50MB limit.');
        }

        $filename = 'publications/' . uniqid() . '.pdf';
        Storage::disk('public')->put($filename, $decoded);

        return $filename;
    }
}