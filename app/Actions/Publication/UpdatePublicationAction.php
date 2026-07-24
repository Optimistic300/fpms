<?php

namespace App\Actions\Publication;

use App\Models\Publication;
use Illuminate\Validation\ValidationException;

class UpdatePublicationAction
{
    public function execute(Publication $publication, array $data): Publication
    {
        if (!empty($data['manuscript_file'])) {
            if ($publication->manuscript_file_path) {
                $this->deleteFile($publication->manuscript_file_path);
            }
            $data['manuscript_file_path'] = $this->storeBase64File($data['manuscript_file']);
        }
        unset($data['manuscript_file']);

        if (isset($data['status']) && $data['status'] === 'PUBLISHED' && empty($publication->doi) && empty($data['doi'] ?? null)) {
            throw ValidationException::withMessages([
                'doi' => 'DOI is required when status is PUBLISHED.',
            ]);
        }

        $publication->update($data);

        return $publication->fresh();
    }

    private function storeBase64File(string $base64): string
    {
        $decoded = base64_decode($base64);
        $filename = 'publications/' . uniqid() . '.pdf';
        $path = storage_path('app/public/' . $filename);

        $dir = dirname($path);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        file_put_contents($path, $decoded);

        return $filename;
    }

    private function deleteFile(string $path): void
    {
        $fullPath = storage_path('app/public/' . $path);
        if (file_exists($fullPath)) {
            unlink($fullPath);
        }
    }
}
