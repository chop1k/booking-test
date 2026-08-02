<?php

declare(strict_types=1);

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class BookRoomDTO
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Choice(choices: [
            1, 2, 3,
        ])]
        public int $room_id,

        #[Assert\NotBlank]
        #[Assert\DateTime(format: 'Y-m-d\TH:i:s.u\Z')]
        public string $starts_at,

        #[Assert\NotBlank]
        #[Assert\DateTime(format: 'Y-m-d\TH:i:s.u\Z')]
        public string $ends_at,

        #[Assert\All([
            new Assert\NotNull(),
            new Assert\Type(BookingAttributeDTO::class),
        ])]
        public ?array $attributes,
    ) {
    }
}
