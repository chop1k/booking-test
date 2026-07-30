<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: '`user`')]
class User
{
    use IdentifiableResourceTrait;

    #[ORM\Column(type: 'string', unique: true)]
    private string $telegramId;

    #[ORM\Column(type: 'string', enumType: VerifiedBy::class, nullable: true)]
    private ?VerifiedBy $verifiedBy = null;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $isAdmin = false;

    public function getTelegramId(): string
    {
        return $this->telegramId;
    }

    public function setTelegramId(string $telegramId): self
    {
        $this->telegramId = $telegramId;
        return $this;
    }

    public function getVerifiedBy(): ?VerifiedBy
    {
        return $this->verifiedBy;
    }

    public function setVerifiedBy(?VerifiedBy $verifiedBy): self
    {
        $this->verifiedBy = $verifiedBy;
        return $this;
    }

    public function isAdmin(): bool
    {
        return $this->isAdmin;
    }

    public function setIsAdmin(bool $isAdmin): self
    {
        $this->isAdmin = $isAdmin;
        return $this;
    }
}