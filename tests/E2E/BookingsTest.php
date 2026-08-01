<?php

declare(strict_types=1);

namespace App\Tests\E2E;

use Carbon\Carbon;
use Symfony\Component\HttpClient\CurlHttpClient;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Testo\Assert;
use Testo\Lifecycle\BeforeTest;
use Testo\Test;

final readonly class BookingsTest
{
    #[BeforeTest]
    public function cleanup(): void
    {
    }

    #[Test]
    public function testCreatesBooking(): void
    {
        $data = [
            'room_id' => 123,
            'starts_at' => Carbon::now(),
            'ends_at' => Carbon::now()->addHour(),
        ];
        $expected = [
            'room_id' => 123,
            'starts_at' => Carbon::now(),
            'ends_at' => Carbon::now()->addHour(),
            'attributes' => [],
        ];

        $client = new CurlHttpClient();

        $this->assertBookingCreated($client, $data, $expected);
        $this->assertBookingAppears($client, $expected);
        $this->assertBookingAppears($client, $expected);
        $this->assertBookingCannotConflict($client);
    }

    private function assertBookingCreated(HttpClientInterface $client, array $data, array $expected): void
    {
        $response = $client->request('POST', '/business/bookings', [
            'headers' => [
                'content-type' => 'application/json',
                'accept' => 'application/json',
            ],
            'body' => json_encode($data),
        ]);

        Assert::equals($response->getStatusCode(), 200);
        Assert::contains($response->getHeaders(), 'content-type');
        Assert::equals($response->getHeaders()['content-type'], 'application/json');

        $json = json_decode($response->getContent(), true);

        unset($json['id']);

        Assert::equals($json, $expected);
    }

    private function assertBookingAppears(HttpClientInterface $client, array $expected): void
    {
        $response = $client->request('GET', '/business/bookings', [
            'headers' => [
                'accept' => 'application/json',
            ],
        ]);

        Assert::equals($response->getStatusCode(), 200);
        Assert::contains($response->getHeaders(), 'content-type');
        Assert::equals($response->getHeaders()['content-type'], 'application/json');

        $json = json_decode($response->getContent(), true);

        unset($json[0]['id']);

        Assert::equals($json, [$expected]);
    }

    private function assertBookingCannotConflict(HttpClientInterface $client): void
    {
        $data = [
            'room_id' => 123,
            'starts_at' => Carbon::now()->addMinutes(10),
            'ends_at' => Carbon::now()->addMinutes(10)->addHour(),
        ];

        $response = $client->request('POST', '/business/bookings', [
            'headers' => [
                'content-type' => 'application/json',
                'accept' => 'application/json',
            ],
            'body' => json_encode($data),
        ]);

        Assert::equals($response->getStatusCode(), 400);
    }

    #[Test]
    public function testReturnsBadRequest(): void
    {
        $data = [
            'room_id' => 123,
            'starts_at' => '123',
            'ends_at' => Carbon::now()->addHour(),
        ];

        $client = new CurlHttpClient();

        $response = $client->request('POST', '/business/bookings', [
            'headers' => [
                'content-type' => 'application/json',
                'accept' => 'application/json',
            ],
            'body' => json_encode($data),
        ]);

        Assert::equals($response->getStatusCode(), 400);
        Assert::contains($response->getHeaders(), 'content-type');
        Assert::equals($response->getHeaders()['content-type'], 'application/json');
    }

    #[Test]
    public function testReturnsUnauthorized(): void
    {
    }

    #[Test]
    public function testReturnsMethodNotAllowed(): void
    {
        $client = new CurlHttpClient();

        $response = $client->request('PUT', '/business/bookings', [
            'headers' => [
                'content-type' => 'application/json',
                'accept' => 'application/json',
            ],
            'body' => json_encode([]),
        ]);

        Assert::equals($response->getStatusCode(), 405);
    }
}
