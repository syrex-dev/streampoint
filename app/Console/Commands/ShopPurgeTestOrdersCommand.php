<?php

namespace App\Console\Commands;

use App\Enums\AccountStatus;
use App\Models\Order;
use App\Models\OrderEvent;
use App\Models\ProductAccount;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ShopPurgeTestOrdersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'shop:purge-test-orders
                            {--i-understand : Konfirmasi bahwa Anda memahami perintah ini menghapus semua data order uji}
                            {--force : Jalankan pembersihan tanpa konfirmasi interaktif}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Bersihkan data order uji dan riwayat sebelum toko dibuka, kembalikan unit akun ke AVAILABLE, dan hapus bukti bayar';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        if (! $this->option('i-understand')) {
            $this->error('Perintah ini berisiko tinggi dan akan menghapus seluruh data order uji serta riwayatnya!');
            $this->warn('Untuk menjalankan, Anda HARUS menyertakan opsi --i-understand:');
            $this->line('  php artisan shop:purge-test-orders --i-understand');
            return Command::FAILURE;
        }

        $orderCount = Order::count();
        $eventCount = OrderEvent::count();
        $accountsQuery = ProductAccount::whereIn('status', [
            AccountStatus::RESERVED,
            AccountStatus::SOLD,
            AccountStatus::RENTED,
        ])->orWhereNotNull('order_id');
        $accountCount = $accountsQuery->count();

        $proofPaths = Order::whereNotNull('payment_proof_path')
            ->pluck('payment_proof_path')
            ->filter()
            ->values()
            ->all();
        $proofCount = count($proofPaths);

        $this->info('Ringkasan data uji yang akan dibersihkan:');
        $this->table(
            ['Entitas / Data', 'Jumlah'],
            [
                ['Order (Pesanan)', $orderCount],
                ['Order Events (Riwayat Log Pesanan)', $eventCount],
                ['Unit Akun Terkait (RESERVED/SOLD/RENTED)', $accountCount],
                ['Berkas Bukti Bayar (Disk Privat)', $proofCount],
            ]
        );

        if ($orderCount === 0 && $eventCount === 0 && $accountCount === 0 && $proofCount === 0) {
            $this->info('Tidak ada data pesanan uji atau unit akun terkait yang perlu dibersihkan.');
            return Command::SUCCESS;
        }

        if (! $this->option('force')) {
            $confirmed = $this->confirm(
                'Apakah Anda yakin ingin menghapus seluruh pesanan uji di atas dan mengembalikan unit akun terkait ke AVAILABLE?',
                false
            );

            if (! $confirmed) {
                $this->warn('Pembersihan data order uji dibatalkan.');
                return Command::SUCCESS;
            }
        }

        $deletedProofs = 0;
        $disk = Storage::disk('private');

        DB::transaction(function () use ($accountsQuery, &$deletedProofs, $disk, $proofPaths) {
            // 1. Kembalikan unit akun RESERVED / SOLD / RENTED menjadi AVAILABLE
            ProductAccount::whereIn('status', [
                AccountStatus::RESERVED,
                AccountStatus::SOLD,
                AccountStatus::RENTED,
            ])->orWhereNotNull('order_id')
            ->update([
                'status' => AccountStatus::AVAILABLE,
                'order_id' => null,
                'rented_until' => null,
            ]);

            // 2. Putuskan relasi account_id pada order agar tidak melanggar foreign key constraint
            Order::query()->update(['account_id' => null]);

            // 3. Hapus order_events dan orders
            OrderEvent::query()->delete();
            Order::query()->delete();

            // 4. Hapus berkas bukti pembayaran dari disk privat
            foreach ($proofPaths as $path) {
                if ($disk->exists($path)) {
                    $disk->delete($path);
                    $deletedProofs++;
                }
            }
        });

        $this->info("Berhasil membersihkan:");
        $this->line(" - {$orderCount} pesanan (orders) dihapus.");
        $this->line(" - {$eventCount} log riwayat pesanan (order_events) dihapus.");
        $this->line(" - {$accountCount} unit akun dikembalikan ke status AVAILABLE (order_id & rented_until dikosongkan).");
        $this->line(" - {$deletedProofs} berkas bukti pembayaran dihapus dari disk privat.");

        return Command::SUCCESS;
    }
}
