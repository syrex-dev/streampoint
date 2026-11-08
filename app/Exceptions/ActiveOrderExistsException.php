<?php

namespace App\Exceptions;

use Exception;

class ActiveOrderExistsException extends Exception
{
    public function __construct(
        public readonly string $invoiceCode,
        public readonly bool $ownedBySession = false,
        public readonly bool $isVerifying = false,
        string $message = 'Kamu masih memiliki pesanan aktif yang belum selesai.'
    ) {
        parent::__construct($message);
    }
}
