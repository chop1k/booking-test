<?php

declare(strict_types=1);

namespace App\Controller\System;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/system/storage', name: 'system_storage_')]
class StorageController extends AbstractController
{
    public function __construct(
        #[Autowire(param: 'kernel.project_dir')]
        private readonly string $kernelRootDir,
    ) {
    }

    #[Route('/files/{file_id}', name: 'get_file', methods: ['GET'])]
    public function getFile(int $file_id): JsonResponse
    {
        $testFiles = [
            1 => [
                'id' => 1,
                'path' => '/images/rooms/.jpg',
                'size' => 245760,
            ],
            2 => [
                'id' => 2,
                'path' => '/uploads/rooms/alpha-layout.pdf',
                'size' => 512000,
            ],
            3 => [
                'id' => 3,
                'path' => '/uploads/rooms/beta-main.jpg',
                'size' => 189440,
            ],
        ];

        if (!isset($testFiles[$file_id])) {
            return $this->json(
                [
                    'type' => 'not_found',
                    'title' => 'File not found',
                    'status' => 404,
                    'detail' => "File with id {$file_id} was not found",
                ],
                Response::HTTP_NOT_FOUND
            );
        }

        return $this->json($testFiles[$file_id], Response::HTTP_OK);
    }

    #[Route('/files/{file_id}/content', name: 'get_file_content', methods: ['GET'])]
    public function getFileContent(int $file_id): Response
    {
        $testFileContents = [
            1 => [
                'content' => file_get_contents(sprintf('%s/public/%s', $this->kernelRootDir, 'images/rooms/coworking.jpg')),
                'mime_type' => 'image/jpeg',
            ],
            2 => [
                'content' => file_get_contents(sprintf('%s/public/%s', $this->kernelRootDir, 'images/rooms/big.jpg')),
                'mime_type' => 'application/pdf',
            ],
            3 => [
                'content' => file_get_contents(sprintf('%s/public/%s', $this->kernelRootDir, 'images/rooms/small.jpg')),
                'mime_type' => 'image/jpeg',
            ],
            4 => [
                'content' => 'binary-image-content-lecture-hall',
                'mime_type' => 'image/jpeg',
            ],
            5 => [
                'content' => 'binary-pdf-content-lecture-scheme',
                'mime_type' => 'application/pdf',
            ],
        ];

        if (!isset($testFileContents[$file_id])) {
            return $this->json(
                [
                    'type' => 'not_found',
                    'title' => 'File not found',
                    'status' => 404,
                    'detail' => "File with id {$file_id} was not found",
                ],
                Response::HTTP_NOT_FOUND
            );
        }

        $fileData = $testFileContents[$file_id];

        return new Response(
            $fileData['content'],
            Response::HTTP_OK,
            ['Content-Type' => $fileData['mime_type']]
        );
    }
}
