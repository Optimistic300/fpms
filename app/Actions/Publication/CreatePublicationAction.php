<?php

namespace App\Actions\Publication;

use App\Events\PublicationCreated;
use App\Models\Document;
use App\Models\Publication;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class CreatePublicationAction
{
    public function execute(array $data): Publication
    {
        Log::info('Starting publication creation process', [
            'title'             => $data['title'] ?? null,
            'linked_project_id' => $data['linked_project_id'] ?? null,
            'has_manuscript'    => !empty($data['manuscript_file']),
            'submitted_by'      => auth()->id(),
        ]);

        $data['submitted_by_id'] = auth()->id();

        // Extract uploaded manuscript file before creating Publication
        $manuscriptFile = $data['manuscript_file'] ?? null;
        $documentIds    = $data['document_ids'] ?? [];
        unset($data['manuscript_file'], $data['document_ids']);

        // 1. Create the publication record
        $publication = Publication::create($data);

        Log::info('Publication record created successfully', [
            'publication_id' => $publication->id,
            'title'          => $publication->title,
        ]);

        // 2. Handle primary manuscript file and convert to a Document model
        if ($manuscriptFile) {
            try {
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

                Log::info('Manuscript stored and linked as Document model', [
                    'publication_id' => $publication->id,
                    'document_id'    => $document->id,
                    'file_path'      => $filePath,
                    'file_size'      => $fileSize,
                ]);
            } catch (\Throwable $e) {
                Log::error('Failed during manuscript file upload/processing', [
                    'publication_id' => $publication->id,
                    'error'          => $e->getMessage(),
                    'trace'          => $e->getTraceAsString(),
                ]);
                throw $e;
            }
        }

        // 3. Attach additional supplementary documents if provided
        if (!empty($documentIds)) {
            $publication->documents()->syncWithoutDetaching($documentIds);
            Log::info('Attached supplementary documents to publication', [
                'publication_id' => $publication->id,
                'document_ids'   => $documentIds,
            ]);
        }

        // 4. Dispatch event
        event(new PublicationCreated($publication));

        Log::info('PublicationCreated event dispatched', [
            'publication_id' => $publication->id,
        ]);

        return $publication;
    }

    private function handleFileUpload(mixed $file): string
    {
        if ($file instanceof UploadedFile) {
            $path = $file->store('publications', 'public');
            
            Log::info('UploadedFile instance stored to disk', [
                'original_name' => $file->getClientOriginalName(),
                'stored_path'   => $path,
            ]);

            return $path;
        }

        $base64 = is_array($file) ? ($file['content'] ?? $file['data'] ?? '') : $file;

        if (empty($base64)) {
            Log::warning('Empty manuscript file content provided to handleFileUpload');
            return '';
        }

        $decoded = base64_decode(preg_replace('#^data:[^;]+;base64,#', '', $base64));

        if ($decoded === false) {
            Log::error('Failed to decode base64 manuscript string');
            throw new \InvalidArgumentException('Invalid base64 encoded file payload.');
        }

        $size = strlen($decoded);
        if ($size > 50 * 1024 * 1024) {
            Log::error('Manuscript file size exceeds allowed threshold', [
                'size_bytes' => $size,
                'max_bytes'  => 50 * 1024 * 1024,
            ]);
            throw new \InvalidArgumentException('File exceeds 50MB limit.');
        }

        $filename = 'publications/' . uniqid() . '.pdf';
        Storage::disk('public')->put($filename, $decoded);

        Log::info('Base64 manuscript saved successfully', [
            'filename'   => $filename,
            'size_bytes' => $size,
        ]);

        return $filename;
    }
}