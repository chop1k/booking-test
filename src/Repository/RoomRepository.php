<?php

declare(strict_types=1);

namespace App\Repository;

use Symfony\Component\Asset\Packages;

final readonly class RoomRepository
{
    public function __construct(
        private Packages $package,
    ) {
    }

    public function find(int $id): ?array
    {
        return $this->findAll()[$id];
    }

    public function findAll(): array
    {
        $rooms = [
            [
                'id' => 1,
                'name' => 'Коворкинг',
                'description' => '',
                'attachments' => [
                    $this->package->getUrl('images/rooms/coworking.jpg'),
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
                    $this->package->getUrl('images/rooms/big.jpg'),
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
                    $this->package->getUrl('images/rooms/small.jpg'),
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

        return $rooms;
    }
}
