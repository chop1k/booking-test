<?php

declare(strict_types=1);

namespace App\DTO;

use Carbon\Carbon;
use Carbon\Exceptions\InvalidFormatException;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Context\ExecutionContextInterface;

#[Assert\Cascade]
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

        /**
         * @var BookingAttributeDTO[]|null $attributes
         */
        #[Assert\All([
            new Assert\NotNull(),
            new Assert\Type(BookingAttributeDTO::class),
        ])]
        public ?array $attributes,
    ) {
    }

    #[Assert\Callback]
    public function validate(ExecutionContextInterface $context): void
    {
        try {
            $from = Carbon::parse($this->starts_at);
            $to = Carbon::parse($this->ends_at);
        } catch (InvalidFormatException) {
            $context->buildViolation('Invalid date format')
                ->addViolation();

            return;
        }

        if ($from >= $to) {
            $context->buildViolation('Timestamp "from" should be earlier than timestamp of "to"')
                ->atPath('from')
                ->addViolation();
        }
    }
}
