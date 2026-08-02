<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Booking;
use DateTimeInterface;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Booking>
 */
class BookingRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Booking::class);
    }

    /**
     * @return Booking[]
     */
    public function findAll(?int $roomId = null, ?DateTimeInterface $from = null, ?DateTimeInterface $to = null): array
    {
        if (null === $from && null === $to) {
            return parent::findAll();
        }

        $qb = $this->createQueryBuilder('b');

        if (null !== $roomId) {
            $qb->andWhere('b.roomId>= :id')
                ->setParameter('id', $roomId);
        }

        if (null !== $from) {
            $qb->andWhere('b.endsAt >= :from')
                ->setParameter('from', $from);
        }

        if (null !== $to) {
            $qb->andWhere('b.startsAt <= :to')
                ->setParameter('to', $to);
        }

        return $qb->getQuery()->getResult();
    }

    public function findByPeriod(DateTimeInterface $from, DateTimeInterface $to): array
    {
    }
}
