<?php

namespace App\Actions\Publication;

use App\Models\Publication;

class CreatePublicationAction
{
    public function execute(array $data): Publication
    {
        $data['submitted_by_id'] = auth()->id();

        if (!empty($data['manuscript_file'])) {
            $data['manuscript_file_path'] = $this->storeBase64File($data['manuscript_file']);
        }
        unset($data['manuscript_file']);

        return Publication::create($data);
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
}
