<?php

namespace App\Services;

use App\Contracts\FileStorageInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FileStorageService implements FileStorageInterface
{
    private string $disk;

    public function __construct()
    {
        $this->disk = 'local';
    }

    public function store(UploadedFile $file, string $path = ''): string
    {
        return $file->store($path ?: 'documents', [$this->disk]);
    }

    public function get(string $path): StreamedResponse
    {
        return Storage::disk($this->disk)->download($path);
    }

    public function delete(string $path): bool
    {
        return Storage::disk($this->disk)->delete($path);
    }

    public function url(string $path): string
    {
        return Storage::disk($this->disk)->url($path);
    }
}
