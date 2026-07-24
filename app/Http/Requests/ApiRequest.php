<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Str;

abstract class ApiRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->isJson() && $this->json()->count() > 0) {
            $this->replace(
                collect($this->json()->all())
                    ->keyBy(fn ($value, $key) => Str::snake($key))
                    ->all()
            );
        } else {
            $this->replace(
                collect($this->all())
                    ->keyBy(fn ($value, $key) => Str::snake($key))
                    ->all()
            );
        }
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'message' => 'The given data was invalid.',
            'errors' => $validator->errors(),
        ], 422));
    }
}
