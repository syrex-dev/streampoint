<?php

namespace App\Console\Commands;

use App\Actions\Order\ExpireOrders;
use Illuminate\Console\Command;

class ExpireOrdersCommand extends Command
{
    protected $signature = 'orders:expire';

    protected $description = 'Expire pending orders past payment expiration time and release reserved accounts';

    public function handle(ExpireOrders $expireOrders): int
    {
        $count = $expireOrders->handle();
        $this->info("Expired {$count} pending order(s).");

        return Command::SUCCESS;
    }
}
