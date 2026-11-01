<?php

namespace App\Exceptions;

use Exception;

class InvalidStatusTransitionException extends Exception
{
    public function __construct(string $from, string $to)
    {
        parent::__construct("Perubahan status tidak diizinkan dari {$from} ke {$to}.", 422);
    }
}
