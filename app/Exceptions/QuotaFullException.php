<?php

namespace App\Exceptions;

use Exception;

class QuotaFullException extends Exception
{
    public function __construct(string $message = 'Kuota sewa hari ini sudah penuh (reset 00:00 WIB).')
    {
        parent::__construct($message, 422);
    }
}
