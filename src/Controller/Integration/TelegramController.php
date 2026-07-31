<?php

declare(strict_types=1);

namespace App\Controller\Integration;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/integration/telegram', name: 'integration_telegram_')]
class TelegramController extends AbstractController
{
    #[Route('/user-avatar/{user_id}', name: 'get_avatar', methods: ['GET'])]
    public function getAvatar(string $user_id): Response
    {
        // TODO: Implement avatar retrieval from Telegram or return default
        return new Response('', Response::HTTP_OK, ['Content-Type' => 'image/png']);
    }
}
