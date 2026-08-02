<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\BookingRepository;
use Carbon\Carbon;
use DateTimeInterface;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use JsonSerializable;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: BookingRepository::class)]
class Booking implements JsonSerializable
{
    use IdentifiableResourceTrait;

    #[ORM\Column(type: 'integer')]
    private int $userId;

    #[Assert\NotBlank]
    #[ORM\Column(type: 'integer')]
    private int $roomId;

    #[Assert\NotBlank]
    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private DateTimeInterface $startsAt;

    #[Assert\NotBlank]
    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private DateTimeInterface $endsAt;

    #[ORM\Column(type: Types::JSON)]
    private array $attributes = [];

    public function getUserId(): int
    {
        return $this->userId;
    }

    public function setUserId(int $userId): self
    {
        $this->userId = $userId;

        return $this;
    }

    public function getRoomId(): int
    {
        return $this->roomId;
    }

    public function setRoomId(int $roomId): self
    {
        $this->roomId = $roomId;

        return $this;
    }

    public function getStatus(): BookingStatus
    {
        $now = Carbon::now();

        if ($now->isBefore($this->startsAt)) {
            return BookingStatus::PENDING;
        }

        if ($now->isAfter($this->endsAt)) {
            return BookingStatus::FINISHED;
        }

        return BookingStatus::IN_USE;
    }

    public function getStartsAt(): DateTimeInterface
    {
        return $this->startsAt;
    }

    public function setStartsAt(DateTimeInterface $startsAt): self
    {
        $this->startsAt = $startsAt;

        return $this;
    }

    public function getEndsAt(): DateTimeInterface
    {
        return $this->endsAt;
    }

    public function setEndsAt(DateTimeInterface $endsAt): self
    {
        $this->endsAt = $endsAt;

        return $this;
    }

    public function getAttributes(): array
    {
        return $this->attributes;
    }

    public function setAttributes(array $attributes): self
    {
        $this->attributes = $attributes;

        return $this;
    }

    public function jsonSerialize(): mixed
    {
        return [
            'id' => $this->id,
            'status' => $this->getStatus(),
            'user_id' => $this->userId,
            'room_id' => $this->roomId,
            'starts_at' => $this->startsAt,
            'ends_at' => $this->endsAt,
            'attributes' => $this->attributes,
        ];
    }
}
