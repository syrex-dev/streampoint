<?php

namespace App\Actions\Order;

class CreateOrderData
{
    public function __construct(
        public int $variantId,
        public string $phone,
        public int $paymentMethodId,
        public ?string $note = null,
        public ?array $ownedInvoices = null
    ) {}
}
