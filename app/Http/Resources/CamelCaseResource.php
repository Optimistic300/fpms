<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

abstract class CamelCaseResource extends JsonResource
{
    protected function camelCaseKeys(mixed $data): mixed
    {
        if (is_array($data)) {
            $result = [];
            foreach ($data as $key => $value) {
                $result[Str::camel($key)] = $this->camelCaseKeys($value);
            }
            return $result;
        }

        if (is_object($data) && !$data instanceof \Stringable) {
            return $data;
        }

        return $data;
    }

    public function toArray($request): array
    {
        $data = $this->resourceToArray($request);

        return $this->camelCaseKeys($data);
    }

    abstract protected function resourceToArray($request): array;
}
