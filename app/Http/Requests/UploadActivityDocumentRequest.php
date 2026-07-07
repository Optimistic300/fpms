<?php

namespace App\Http\Requests;

class UploadActivityDocumentRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png,gif,doc,docx,xls,xlsx,csv,zip|max:25600',
            'type' => 'required|in:DATA_SHEET,PHOTO,MAP,RECEIPT,REPORT,MANUSCRIPT,OTHER',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->isJson()) {
            parent::prepareForValidation();
        }
    }
}
