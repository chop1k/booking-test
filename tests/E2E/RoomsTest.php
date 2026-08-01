<?php

declare(strict_types=1);

namespace App\Tests\E2E;

use Symfony\Component\HttpClient\CurlHttpClient;
use Testo\Assert;
use Testo\Test;

final readonly class RoomsTest
{
    #[Test]
    public function testReturnsRooms(): void
    {
        $expected = [
            [
                'id' => 1,
                'name' => 'Коворкинг',
                'description' => '',
                'attachments' => [
                    [
                        'id' => 1,
                        'path' => '/images/rooms/coworking.jpg',
                        'size' => 245760,
                    ],
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
                    [
                        'id' => 2,
                        'path' => '/images/rooms/big.jpg',
                        'size' => 189440,
                    ],
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
                    [
                        'id' => 3,
                        'path' => '/images/rooms/small.jpg',
                        'size' => 189440,
                    ],
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

        $client = new CurlHttpClient();

        $response = $client->request('GET', '/business/rooms', [
            'headers' => [
                'accept' => 'application/json',
            ],
        ]);

        Assert::equals($response->getStatusCode(), 200);
        Assert::contains($response->getHeaders(), 'content-type');
        Assert::equals($response->getHeaders()['content-type'], 'application/json');

        $json = json_decode($response->getContent(), true);

        Assert::equals($json, $expected);
    }

    #[Test]
    public function testReturnsUnauthorized(): void
    {
    }

    #[Test]
    public function testReturnsMethodNotAllowed(): void
    {
        $client = new CurlHttpClient();

        $response = $client->request('PUT', '/business/rooms', [
            'headers' => [
                'content-type' => 'application/json',
                'accept' => 'application/json',
            ],
            'body' => json_encode([]),
        ]);

        Assert::equals($response->getStatusCode(), 405);
    }
}
