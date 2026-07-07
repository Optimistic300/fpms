<?php

namespace Tests\Feature;

use App\Http\Requests\ApiRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Tests\TestCase;

class ApiConventionsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Route::post('api/test-camel', function (\Tests\Feature\CamelTestRequest $request) {
            return response()->json($request->all());
        })->middleware('api');

        Route::post('api/test-validation', function (\Tests\Feature\ValidationTestRequest $request) {
            return response()->json(['ok' => true]);
        })->middleware('api');
    }

    public function test_api_request_transforms_camel_case_to_snake_case(): void
    {
        $response = $this->postJson('/api/test-camel', [
            'fullName' => 'John Doe',
            'userRole' => 'admin',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'full_name' => 'John Doe',
            'user_role' => 'admin',
        ]);
    }

    public function test_validation_error_returns_standard_envelope(): void
    {
        $response = $this->postJson('/api/test-validation', [
            'emailAddress' => 'not-an-email',
        ]);

        $response->assertStatus(422);
        $response->assertJsonStructure([
            'message',
            'errors' => ['email_address'],
        ]);
    }
}

class CamelTestRequest extends ApiRequest
{
    public function rules(): array
    {
        return ['full_name' => 'required|string', 'user_role' => 'required|string'];
    }
}

class ValidationTestRequest extends ApiRequest
{
    public function rules(): array
    {
        return ['email_address' => 'required|email'];
    }
}
