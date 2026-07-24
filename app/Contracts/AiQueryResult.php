<?php

namespace App\Contracts;

readonly class AiQueryResult
{
    public function __construct(
        public bool $canAnswer,
        public string $answer,
        public array $citations,
        public array $followUpPrompts,
    ) {}
}
