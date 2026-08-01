<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Room;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Room>
 */
class RoomRepository extends ServiceEntityRepository
{
    private array $rooms = [
        [
            'id' => 1,
            'name' => 'Коворкинг',
            'description' => '',
            'attachments' => [
                'path' => '/assets/images/rooms/coworking.jpg',
            ],
            'attributes' => [
                [
                    'type' => 'seats',
                    'count' => 3,
                    'capacity' => 5,
                ],
                [
                    'type' => 'boards',
                    'count' => 1,
                ],
                [
                    'type' => 'air-conditioners',
                    'count' => 1,
                ],
            ],
        ],
        [
            'id' => 2,
            'name' => 'Большая переговорная',
            'description' => 'Большая комната в ',
            'attachments' => [
                'path' => '/assets/images/rooms/big.jpg',
            ],
            'attributes' => [
                [
                    'type' => 'seats',
                    'count' => 10,
                    'capacity' => 10,
                ],
                [
                    'type' => 'displays',
                    'count' => 1,
                ],
                [
                    'type' => 'tables',
                    'count' => 1,
                ],
                [
                    'type' => 'air-conditioners',
                    'count' => 1,
                ],
            ],
        ],
        [
            'id' => 3,
            'name' => 'Малая переговорная',
            'description' => 'Малая комната в ',
            'attachments' => [
                '/assets/images/rooms/small.jpg',
            ],
            'attributes' => [
                [
                    'type' => 'seats',
                    'count' => 9,
                    'capacity' => 9,
                ],
                [
                    'type' => 'tables',
                    'count' => 1,
                ],
                [
                    'type' => 'air-conditioners',
                    'count' => 1,
                ],
            ],
        ],
    ];

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Room::class);
    }

    public function findAll(): array
    {
        return $this->rooms;
    }
}
