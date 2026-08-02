<?php

declare(strict_types=1);

namespace App\DTO;

final readonly class AuthDTO
{
    public function __construct(
        public string $token,
        public string $chat_id,
    ) {
    }
}
