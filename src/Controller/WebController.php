<?php

declare(strict_types=1);

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/web', name: 'web_', format: 'html')]
class WebController extends AbstractController
{
    #[Route('/rooms', name: 'rooms', methods: ['GET'])]
    public function rooms(): Response
    {
        return $this->render('room_selection.html.twig');
    }

    #[Route('/home', name: 'home', methods: ['GET'])]
    public function home(): Response
    {
        return $this->render('home.html.twig');
    }
}
