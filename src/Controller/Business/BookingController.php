<?php

declare(strict_types=1);

namespace App\Controller\Business;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/business/bookings', name: 'business_booking_', format: 'json')]
class BookingController extends AbstractController
{
    #[Route('', name: 'business_get_bookings', methods: ['GET'])]
    public function bookings(Request $request): JsonResponse
    {
        $testBookings = [
            [
                'id' => 1,
                'user_id' => 101,
                'room_id' => 3,
                'status' => 'pending',
                'starts_at' => '2026-08-01T09:00:00+00:00',
                'ends_at' => '2026-08-01T11:00:00+00:00',
                'attributes' => [
                    [
                        'type' => 'seats',
                        'count' => 4,
                    ],
                    [
                        'type' => 'displays',
                        'count' => 2,
                    ],
                ],
            ],
            [
                'id' => 2,
                'user_id' => 102,
                'room_id' => 5,
                'status' => 'in_use',
                'starts_at' => '2026-08-01T10:00:00+00:00',
                'ends_at' => '2026-08-01T12:00:00+00:00',
                'attributes' => [
                    [
                        'type' => 'seats',
                        'count' => 8,
                    ],
                    [
                        'type' => 'boards',
                        'count' => 1,
                    ],
                    [
                        'type' => 'air-conditioners',
                        'count' => 2,
                    ],
                ],
            ],
            [
                'id' => 3,
                'user_id' => 103,
                'room_id' => 1,
                'status' => 'finished',
                'starts_at' => '2026-07-29T14:00:00+00:00',
                'ends_at' => '2026-07-29T16:00:00+00:00',
                'attributes' => [
                    [
                        'type' => 'seats',
                        'count' => 2,
                    ],
                    [
                        'type' => 'tables',
                        'count' => 1,
                    ],
                    [
                        'type' => 'displays',
                        'count' => 1,
                    ],
                ],
            ],
        ];

        return $this->json($testBookings, Response::HTTP_OK);
    }

    #[Route('/bookings', name: 'business_book_room', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $testCreatedBooking = [
            'id' => 4,
            'user_id' => 101,
            'room_id' => 2,
            'status' => 'pending',
            'starts_at' => '2026-08-02T15:00:00+00:00',
            'ends_at' => '2026-08-02T17:00:00+00:00',
            'attributes' => [
                [
                    'type' => 'seats',
                    'count' => 6,
                ],
                [
                    'type' => 'displays',
                    'count' => 1,
                ],
                [
                    'type' => 'office-attributes',
                    'count' => 1,
                ],
            ],
        ];

        return $this->json($testCreatedBooking, Response::HTTP_OK);
    }
}
