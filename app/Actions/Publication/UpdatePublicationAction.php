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
            $base64 = is_array($data['manuscript_file']) ? ($data['manuscript_file']['content'] ?? $data['manuscript_file']['data'] ?? '') : $data['manuscript_file'];
            $data['manuscript_file_path'] = $this->storeBase64File($base64);
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
        $decoded = base64_decode(preg_replace('#^data:[^;]+;base64,#', '', $base64));
        // enforce size limit 50MB
        if (strlen($decoded) > 50 * 1024 * 1024) {
            throw new \Exception('Manuscript exceeds 50MB limit.');
        }
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
