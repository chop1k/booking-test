<?php

declare(strict_types=1);

namespace App\Controller\Business;

use App\DTO\BookRoomDTO;
use App\Entity\Booking;
use App\Repository\BookingRepository;
use Carbon\Carbon;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryParameter;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/business/bookings', name: 'business_booking_', format: 'json')]
class BookingController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly BookingRepository $bookingRepository,
    ) {
    }

    #[IsGranted("ROLE_USER")]
    #[Route('', name: 'business_get_bookings', methods: ['GET'])]
    public function bookings(#[MapQueryParameter] ?int $from, #[MapQueryParameter] ?int $to): JsonResponse
    {
        $from = Carbon::createFromTimestamp($from);
        $to = Carbon::createFromTimestamp($to);

        $bookings = $this->bookingRepository->findAll(null, $from, $to);

        return $this->json($bookings, Response::HTTP_OK);
    }

    #[IsGranted('ROLE_USER')]
    #[Route('', name: 'business_book_room', methods: ['POST'])]
    public function create(#[MapRequestPayload] BookRoomDTO $dto, UserInterface $user): JsonResponse
    {
        $from = Carbon::parse($dto->starts_at);
        $to = Carbon::parse($dto->ends_at);

        $bookings = $this->bookingRepository->findAll($dto->room_id, $from, $to);

        if (0 !== count($bookings)) {
            return $this->json([
                'type' => 'conflict_error',
                'status' => Response::HTTP_CONFLICT,
                'title' => 'The booking`s starts_at or ends_at conflicts with another booking`s starts_at or ends_at',
                'resources' => $bookings,
            ], Response::HTTP_CONFLICT);
        }

        $booking = new Booking();

        $booking->setUserId($user->getUserIdentifier());
        $booking->setRoomId($dto->room_id);
        $booking->setStartsAt($from);
        $booking->setEndsAt($to);
        $booking->setAttributes($dto->attributes ?? []);

        $this->entityManager->persist($booking);
        $this->entityManager->flush();

        return $this->json($dto, Response::HTTP_CREATED);
    }
}
