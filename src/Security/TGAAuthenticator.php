<?php

declare(strict_types=1);

namespace App\Security;

use App\Repository\UserRepository;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

class TGAAuthenticator extends AbstractAuthenticator
{
    public function __construct(
        #[Autowire(env: 'TELEGRAM_BOT_TOKEN')]
        private readonly string $botToken,

        private readonly UserRepository $userRepository,
    ) {
    }

    public function supports(Request $request): ?bool
    {
        return $request->headers->has('Authorization');
    }

    public function authenticate(Request $request): Passport
    {
        $token = $request->headers->get('Authorization');

        $token = str_replace('Bearer ', '', $token);

        parse_str($token, $data);

        $hash = $data['hash'];
        unset($data['hash']);

        ksort($data);

        $checkString = implode("\n", array_map(
            fn ($key, $value) => "$key=$value",
            array_keys($data),
            $data
        ));

        $secret = hash_hmac('sha256', $this->botToken, 'WebAppData', true);

        $calculatedHash = bin2hex(
            hash_hmac('sha256', $checkString, $secret, true)
        );

        if (!hash_equals($hash, $calculatedHash)) {
            throw new AuthenticationException('Подпись невалидна');
        }

        if (time() - $data['auth_date'] > 86400) {
            throw new AuthenticationException('Данные устарели');
        }

        $user = json_decode($data['user'], true, flags: JSON_THROW_ON_ERROR);

        $passport = new SelfValidatingPassport(
            new UserBadge((string) $user['id'], $this->user(...))
        );

        $passport->setAttribute('user_id', $user['id']);

        return $passport;
    }

    private function user(string $id): UserInterface
    {
        $id = (int) $id;

        if (0 === $id) {
            throw new AuthenticationException('Cannot convert id to an integer');
        }

        return $this->userRepository->find($id);
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        return null;
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        $data = [
            'message' => strtr($exception->getMessageKey(), $exception->getMessageData()),
        ];

        return new JsonResponse($data, Response::HTTP_UNAUTHORIZED);
    }
}
