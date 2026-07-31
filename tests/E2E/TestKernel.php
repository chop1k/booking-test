<?php

declare(strict_types=1);

namespace App\Tests\E2E;

use App\Kernel;

final readonly class TestKernel
{
    private Kernel $kernel;

    public function __construct()
    {
        $this->kernel = new Kernel('test', true);
    }


}