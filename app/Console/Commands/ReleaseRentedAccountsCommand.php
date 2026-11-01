<?php

namespace App\Console\Commands;

use App\Enums\AccountStatus;
use App\Models\ProductAccount;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ReleaseRentedAccountsCommand extends Command
{
    protected $signature = 'accounts:release-rented';

    protected $description = 'Lepaskan unit akun sewa yang telah melewati masa berlaku ke status AVAILABLE';

    public function handle(): int
    {
        $count = DB::transaction(function () {
            $accounts = ProductAccount::where('status', AccountStatus::RENTED)
                ->whereNotNull('rented_until')
                ->where('rented_until', '<=', now())
                ->lockForUpdate()
                ->get();

            $released = 0;
            foreach ($accounts as $account) {
                $account->update([
                    'status' => AccountStatus::AVAILABLE,
                    'order_id' => null,
                    'rented_until' => null,
                ]);
                $released++;
            }

            return $released;
        });

        $this->info("Berhasil melepaskan {$count} unit akun sewa ke status AVAILABLE.");

        return Command::SUCCESS;
    }
}
