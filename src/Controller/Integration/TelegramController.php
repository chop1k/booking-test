<?php

declare(strict_types=1);

namespace App\Controller\Integration;

use App\DTO\AuthDTO;
use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityNotFoundException;
use Exception;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Contracts\HttpClient\HttpClientInterface;

#[Route('/integration/telegram', name: 'integration_telegram_')]
class TelegramController extends AbstractController
{
    private const TELEGRAM_API_URL = 'https://api.telegram.org/bot';

    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly LoggerInterface $logger,
        #[Autowire(env: 'TELEGRAM_TOKEN')]
        private readonly string $telegramBotToken,
        #[Autowire(env: 'ACCESS_TOKEN')]
        private readonly string $accessToken,
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('/authentication', name: 'auth', methods: ['POST'])]
    public function authentication(#[MapRequestPayload] AuthDTO $dto): Response
    {
        if ($dto->token !== $this->accessToken) {
            return $this->json([
                'type' => 'access_denied',
                'status' => Response::HTTP_FORBIDDEN,
                'title' => 'Invalid token',
            ], Response::HTTP_FORBIDDEN);
        }

        try {
            $user = $this->userRepository->findById($dto->chat_id);
        } catch (EntityNotFoundException $e) {
            $user = new User();

            $user->setId($dto->chat_id);

            $this->entityManager->persist($user);
            $this->entityManager->flush();
        }

        return $this->json($user, Response::HTTP_CREATED);
    }

    #[Route('/user-avatar/{user_id}', name: 'get_avatar', methods: ['GET'])]
    public function getAvatar(string $user_id): Response
    {
        try {
            $userInfo = $this->getUserInfo($user_id);

            if (!$userInfo || !isset($userInfo['photo'])) {
                return $this->getDefaultAvatar();
            }

            $fileInfo = $this->getFileInfo($userInfo['photo']['big_file_id'] ?? $userInfo['photo']['small_file_id']);

            if (!$fileInfo || !isset($fileInfo['file_path'])) {
                return $this->getDefaultAvatar();
            }

            $avatarContent = $this->downloadFile($fileInfo['file_path']);

            if (!$avatarContent) {
                return $this->getDefaultAvatar();
            }

            $contentType = $this->getContentType($fileInfo['file_path']);

            return new Response($avatarContent, Response::HTTP_OK, [
                'Content-Type' => $contentType,
            ]);
        } catch (Exception $e) {
            $this->logger->error('Error getting Telegram avatar', [
                'user_id' => $user_id,
                'error' => $e->getMessage(),
            ]);

            return $this->getDefaultAvatar();
        }
    }

    private function getUserInfo(string $userId): ?array
    {
        try {
            $response = $this->httpClient->request('GET', self::TELEGRAM_API_URL.$this->telegramBotToken.'/getUserProfilePhotos', [
                'query' => [
                    'user_id' => $userId,
                    'limit' => 1,
                    'offset' => 0,
                ],
            ]);

            $data = $response->toArray();

            if ($data['ok'] && isset($data['result']['total_count']) && $data['result']['total_count'] > 0) {
                $photos = $data['result']['photos'];
                if (!empty($photos)) {
                    $firstPhoto = $photos[0];

                    return ['photo' => [
                        'small_file_id' => $firstPhoto[0]['file_id'] ?? null,
                        'big_file_id' => end($firstPhoto)['file_id'] ?? null,
                    ]];
                }
            }

            return null;
        } catch (Exception $e) {
            $this->logger->error('Failed to get user info from Telegram', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    private function getFileInfo(string $fileId): ?array
    {
        try {
            $response = $this->httpClient->request('GET', self::TELEGRAM_API_URL.$this->telegramBotToken.'/getFile', [
                'query' => ['file_id' => $fileId],
            ]);

            $data = $response->toArray();

            if ($data['ok'] && isset($data['result']['file_path'])) {
                return $data['result'];
            }

            return null;
        } catch (Exception $e) {
            $this->logger->error('Failed to get file info from Telegram', [
                'file_id' => $fileId,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    private function downloadFile(string $filePath): ?string
    {
        try {
            $url = 'https://api.telegram.org/file/bot'.$this->telegramBotToken.'/'.$filePath;

            $response = $this->httpClient->request('GET', $url);

            $content = $response->getContent();

            return $content ?: null;
        } catch (Exception $e) {
            $this->logger->error('Failed to download file from Telegram', [
                'file_path' => $filePath,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    private function getDefaultAvatar(): Response
    {
        $defaultAvatarPath = $this->getParameter('kernel.project_dir').'/assets/images/default_avatar.jpeg';

        $content = file_get_contents($defaultAvatarPath);

        return new Response($content, Response::HTTP_OK, [ // todo: добавить кеш для прода (и только для прода)
            'Content-Type' => 'image/jpeg',
        ]);
    }

    private function getContentType(string $filePath): string
    {
        $extension = pathinfo($filePath, PATHINFO_EXTENSION);

        return match (strtolower($extension)) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            default => 'image/jpeg',
        };
    }
}
