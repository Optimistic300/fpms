<?php

namespace Tests\Feature;

use App\Http\Resources\BaseResource;
use App\Http\Resources\CamelCaseResource;
use Tests\TestCase;

class CamelCaseResourceTest extends TestCase
{
    public function test_camel_case_resource_converts_snake_case_keys(): void
    {
        $resource = new class ([(object) ['full_name' => 'John', 'user_role' => 'admin']]) extends CamelCaseResource {
            protected function resourceToArray($request): array
            {
                $item = $this->resource[0];
                return [
                    'full_name' => $item->full_name,
                    'user_role' => $item->user_role,
                ];
            }
        };

        $response = $resource->response();
        $body = json_decode($response->getContent(), true);

        $this->assertArrayHasKey('fullName', $body['data']);
        $this->assertArrayHasKey('userRole', $body['data']);
        $this->assertSame('John', $body['data']['fullName']);
        $this->assertSame('admin', $body['data']['userRole']);
    }

    public function test_camel_case_resource_converts_nested_arrays(): void
    {
        $resource = new class ([(object) ['user_info' => ['first_name' => 'Jane', 'last_name' => 'Doe']]]) extends CamelCaseResource {
            protected function resourceToArray($request): array
            {
                return $this->resource[0]->user_info;
            }
        };

        $response = $resource->response();
        $body = json_decode($response->getContent(), true);

        $this->assertArrayHasKey('firstName', $body['data']);
        $this->assertArrayHasKey('lastName', $body['data']);
    }

    public function test_has_message_trait_adds_message_to_response(): void
    {
        $resource = new class (['key' => 'value']) extends BaseResource {
            protected function resourceToArray($request): array
            {
                return $this->resource;
            }
        };

        $resource->withMessage('Created successfully');
        $response = $resource->response();
        $body = json_decode($response->getContent(), true);

        $this->assertArrayHasKey('message', $body);
        $this->assertSame('Created successfully', $body['message']);
    }

    public function test_has_message_trait_omits_message_when_not_set(): void
    {
        $resource = new class (['key' => 'value']) extends BaseResource {
            protected function resourceToArray($request): array
            {
                return $this->resource;
            }
        };

        $response = $resource->response();
        $body = json_decode($response->getContent(), true);

        $this->assertArrayNotHasKey('message', $body);
        $this->assertArrayHasKey('data', $body);
    }
}
