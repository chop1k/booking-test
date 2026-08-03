<?php

declare(strict_types=1);

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class BookingAttributeDTO
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Choice(choices: [
            'seats',
            'displays',
            'boards',
            'tables',
            'air-conditioners',
            'office-attributes',
            'power-outlets',
        ])]
        public string $type,

        #[Assert\NotBlank]
        #[Assert\GreaterThan(0)]
        public int $count,
    ) {
    }
}
