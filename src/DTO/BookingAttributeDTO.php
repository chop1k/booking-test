<?php

declare(strict_types=1);

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class BookingAttributeDTO
{
    public function __construct(
        public string $type,

        #[Assert\GreaterThan(0)]
        public int $count,
    ) {
    }
}
