<?php

declare(strict_types=1);

namespace App\Entity;

enum BookingStatus: string
{
    case PENDING = 'pending';
    case IN_USE = 'in_use';
    case FINISHED = 'finished';
}
