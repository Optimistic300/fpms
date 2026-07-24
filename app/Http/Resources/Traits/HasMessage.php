<?php

namespace App\Http\Resources\Traits;

trait HasMessage
{
    protected ?string $responseMessage = null;

    public function withMessage(?string $message): static
    {
        $this->responseMessage = $message;
        return $this;
    }

    public function with($request): array
    {
        $result = [];

        if ($this->responseMessage !== null) {
            $result['message'] = $this->responseMessage;
        }

        return $result;
    }
}
