<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\RoomRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: RoomRepository::class)]
class Room
{
    use IdentifiableResourceTrait;

    #[ORM\Column(type: 'string', length: 42)]
    private string $name;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    /** @var Collection<int, File> */
    #[ORM\ManyToMany(targetEntity: File::class)]
    #[ORM\JoinTable(name: 'room_attachments')]
    private Collection $attachments;

    #[ORM\Column(type: Types::JSON)]
    private array $attributes = [];

    public function __construct()
    {
        $this->attachments = new ArrayCollection();
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;
        return $this;
    }

    /** @return Collection<int, File> */
    public function getAttachments(): Collection
    {
        return $this->attachments;
    }

    public function addAttachment(File $file): self
    {
        if (!$this->attachments->contains($file)) {
            $this->attachments->add($file);
        }
        return $this;
    }

    public function removeAttachment(File $file): self
    {
        $this->attachments->removeElement($file);
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
}