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
    public function findAll(?DateTimeInterface $from = null, ?DateTimeInterface $to = null): array
    {
        if ($from === null && $to === null) {
            return parent::findAll();
        }

        $qb = $this->createQueryBuilder('b');

        if ($from !== null) {
            $qb->andWhere('b.endsAt >= :from')
                ->setParameter('from', $from);
        }

        if ($to !== null) {
            $qb->andWhere('b.startsAt <= :to')
                ->setParameter('to', $to);
        }

        return $qb->getQuery()->getResult();
    }
}
