<?php

namespace App\Exceptions;

use Exception;

class OutOfStockException extends Exception
{
    public function __construct(string $message = 'Stok akun untuk layanan ini sedang habis.')
    {
        parent::__construct($message, 422);
    }
}
