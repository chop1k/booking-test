<?php

declare(strict_types=1);

namespace App\Controller\Business;

use App\Repository\RoomRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/business')]
class RoomController extends AbstractController
{
    public function __construct(
        private readonly RoomRepository $roomRepository,
    ) {
    }

    #[Route('/rooms', name: 'business_get_rooms', methods: ['GET'])]
    public function getRooms(): JsonResponse
    {
        $rooms = $this->roomRepository->findAll();

        return $this->json($rooms, Response::HTTP_OK);
    }
}
