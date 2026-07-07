<?php

namespace App\Contracts;

use Illuminate\Http\UploadedFile;

interface FileStorageInterface
{
    public function store(UploadedFile $file, string $path = ''): string;

    public function get(string $path): \Symfony\Component\HttpFoundation\StreamedResponse;

    public function delete(string $path): bool;

    public function url(string $path): string;
}
