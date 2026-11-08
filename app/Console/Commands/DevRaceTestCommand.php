<?php

namespace App\Console\Commands;

use App\Actions\Order\CreateOrder;
use App\Actions\Order\CreateOrderData;
use App\Enums\AccountStatus;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Enums\PaymentMethodType;
use App\Enums\RentDuration;
use App\Models\Banner;
use App\Models\DailyQuotaOverride;
use App\Models\Order;
use App\Models\OrderEvent;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductAccount;
use App\Models\ProductVariant;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

class DevRaceTestCommand extends Command
{
    protected $signature = 'dev:race-test
        {--worker : Jalankan dalam mode child worker}
        {--worker-id= : ID indeks worker}
        {--scratch-dir= : Direktori sinkronisasi sinyal}
        {--variant-id= : ID varian produk}
        {--payment-method-id= : ID metode pembayaran}
        {--phone= : Nomor telepon pemesan}';

    protected $description = 'Uji konkurensi (race condition) alur pemesanan dengan proses serentak dan database terpisah';

    public function handle(): int
    {
        if ($this->option('worker')) {
            return $this->handleWorker();
        }

        return $this->handleRunner();
    }

    /**
     * Mode Runner Utama
     */
    protected function handleRunner(): int
    {
        // 1. Guard environment
        if (! app()->environment('local')) {
            $this->error('dev:race-test hanya diizinkan berjalan di environment local.');
            return Command::FAILURE;
        }

        // 2. Guard koneksi MySQL/MariaDB
        $driver = DB::connection()->getDriverName();
        if ($driver !== 'mysql' && $driver !== 'mariadb') {
            $this->error("dev:race-test membutuhkan koneksi MySQL atau MariaDB. Koneksi aktif: {$driver}");
            return Command::FAILURE;
        }

        $this->info('=== STREAMPOINT CONCURRENCY & RACE CONDITION TEST ===');
        $this->line('Waktu: ' . now()->toIso8601String());

        // Catat jumlah record awal di database lokal streampoint
        $originalDbName = DB::connection()->getDatabaseName();
        $initialCounts = $this->captureCounts();

        $this->line("Database awal: {$originalDbName}");
        $this->line('Record awal: ' . json_encode($initialCounts));
        $this->newLine();

        $testDbName = 'streampoint_race';

        try {
            // Buat database terpisah streampoint_race
            $this->info("Membuat database terpisah `{$testDbName}`...");
            DB::statement("CREATE DATABASE IF NOT EXISTS `{$testDbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

            // Alihkan koneksi runner ke streampoint_race
            config(['database.connections.mysql.database' => $testDbName]);
            DB::purge('mysql');
            DB::reconnect('mysql');

            // Safety guard: tolak berjalan jika nama DB tidak berakhiran _race atau _test
            $activeDb = DB::connection()->getDatabaseName();
            if (! str_ends_with($activeDb, '_race') && ! str_ends_with($activeDb, '_test')) {
                $this->error("SAFETY GUARD TRIGGERED: Database aktif '{$activeDb}' tidak berakhiran '_race' atau '_test'!");
                return Command::FAILURE;
            }

            $this->info("Database aktif dialihkan ke: {$activeDb}");
            $this->line("Menjalankan migrasi di database `{$activeDb}`...");
            $this->callSilent('migrate:fresh', ['--database' => 'mysql', '--force' => true]);

            // Siapkan master data dasar pada streampoint_race
            $masterData = $this->setupMasterData();

            // Jalankan 5 Skenario x 5 Putaran
            $scenarios = [
                'A' => 'Skenario A (kuota/unit terakhir, RENT: 8 proses serentak, 1 unit AVAILABLE, kuota=3/override=1)',
                'B' => 'Skenario B (kuota global: 10 proses serentak, stok melimpah, kuota=3)',
                'C' => 'Skenario C (BUY stok terakhir: 8 proses serentak, 1 unit AVAILABLE)',
                'D' => 'Skenario D (kode unik: 6 proses serentak varian berharga sama, stok cukup)',
                'E' => 'Skenario E (satu pesanan aktif per pembeli: 8 proses serentak nomor sama ke varian berbeda; tepat 1 order berhasil)',
            ];

            $allPassed = true;

            foreach ($scenarios as $key => $title) {
                $this->newLine();
                $this->info(">>> {$title}");
                $scenarioPassed = true;

                for ($round = 1; $round <= 5; $round++) {
                    $roundResult = match ($key) {
                        'A' => $this->runScenarioA($round, $masterData),
                        'B' => $this->runScenarioB($round, $masterData),
                        'C' => $this->runScenarioC($round, $masterData),
                        'D' => $this->runScenarioD($round, $masterData),
                        'E' => $this->runScenarioE($round, $masterData),
                    };

                    if (! $roundResult['passed']) {
                        $scenarioPassed = false;
                        $allPassed = false;
                    }

                    $statusTag = $roundResult['passed'] ? '<info>[LULUS]</info>' : '<error>[GAGAL]</error>';
                    $this->line("  Putaran {$round}/5: {$statusTag} {$roundResult['summary']}");
                }

                if (! $scenarioPassed) {
                    $this->error("Skenario {$key} memiliki putaran yang menyimpang!");
                }
            }

            $this->newLine();
            if ($allPassed) {
                $this->info('SEMUA SKENARIO DAN PUTARAN LULUS 100%! Tidak ada race condition terdeteksi.');
            } else {
                $this->error('TERDAPAT SKENARIO YANG GAGAL. Periksa penguncian di CreateOrder.');
            }

        } finally {
            // Bersihkan data: drop database streampoint_race di akhir
            $this->newLine();
            $this->info("Membersihkan database `{$testDbName}`...");
            try {
                // Alihkan koneksi kembali ke originalDbName agar bisa DROP testDbName
                config(['database.connections.mysql.database' => $originalDbName]);
                DB::purge('mysql');
                DB::reconnect('mysql');

                DB::statement("DROP DATABASE IF EXISTS `{$testDbName}`");
                $this->line("Database `{$testDbName}` berhasil dihapus.");
            } catch (Throwable $e) {
                $this->warn("Peringatan saat menghapus database: " . $e->getMessage());
            }

            // Pastikan database streampoint tidak berubah
            $finalCounts = $this->captureCounts();
            $this->line("Database akhir: " . DB::connection()->getDatabaseName());
            $this->line('Record akhir: ' . json_encode($finalCounts));

            $isIdentical = ($initialCounts === $finalCounts);
            if ($isIdentical) {
                $this->info('VERIFIKASI INTEGRITAS: Database lokal `streampoint` 100% identik sebelum dan sesudah uji.');
            } else {
                $this->error('PERINGATAN: Terjadi perubahan data pada database `streampoint`!');
                $this->line('Sebelum: ' . json_encode($initialCounts));
                $this->line('Sesudah: ' . json_encode($finalCounts));
            }
        }

        return $allPassed ? Command::SUCCESS : Command::FAILURE;
    }

    /**
     * Mode Child Worker
     */
    protected function handleWorker(): int
    {
        // 1. Guard local
        if (! app()->environment('local')) {
            $this->outputWorkerJson(['success' => false, 'error' => 'Not in local environment']);
            return Command::FAILURE;
        }

        // 2. Safety guard: nama DB harus berakhiran _race atau _test
        $activeDb = DB::connection()->getDatabaseName();
        if (! str_ends_with($activeDb, '_race') && ! str_ends_with($activeDb, '_test')) {
            $this->outputWorkerJson(['success' => false, 'error' => "Safety guard: Database {$activeDb} bukan _race / _test"]);
            return Command::FAILURE;
        }

        $workerId = (int) $this->option('worker-id');
        $scratchDir = $this->option('scratch-dir');
        $variantId = (int) $this->option('variant-id');
        $paymentMethodId = (int) $this->option('payment-method-id');
        $phone = (string) ($this->option('phone') ?: '081234567890');

        if (! $scratchDir || ! is_dir($scratchDir)) {
            $this->outputWorkerJson(['success' => false, 'error' => 'Invalid scratch dir']);
            return Command::FAILURE;
        }

        // Tulis berkas ready untuk memberi sinyal ke runner bahwa worker sudah boot
        $readyFile = $scratchDir . DIRECTORY_SEPARATOR . "ready_{$workerId}.tmp";
        file_put_contents($readyFile, (string) getmypid());

        // Tunggu sinyal mulai serentak
        $signalFile = $scratchDir . DIRECTORY_SEPARATOR . 'start.signal';
        $startWait = microtime(true);
        while (! file_exists($signalFile)) {
            usleep(500); // 0.5 ms
            if (microtime(true) - $startWait > 20) {
                $this->outputWorkerJson(['success' => false, 'error' => 'Timeout waiting for signal']);
                return Command::FAILURE;
            }
        }

        // PANGGIL CreateOrder SERENTAK
        try {
            $createOrder = app(CreateOrder::class);
            $order = $createOrder->handle(new CreateOrderData(
                variantId: $variantId,
                phone: $phone,
                paymentMethodId: $paymentMethodId,
                note: "Race Worker {$workerId}"
            ));

            $this->outputWorkerJson([
                'worker_id' => $workerId,
                'success' => true,
                'order_id' => $order->id,
                'unique_code' => $order->unique_code,
                'total_amount' => $order->total_amount,
                'invoice_code' => $order->invoice_code,
            ]);

            return Command::SUCCESS;
        } catch (Throwable $e) {
            $this->outputWorkerJson([
                'worker_id' => $workerId,
                'success' => false,
                'exception' => class_basename($e),
                'message' => $e->getMessage(),
            ]);

            return Command::SUCCESS;
        }
    }

    protected function outputWorkerJson(array $data): void
    {
        $this->line(json_encode($data));
    }

    /**
     * Setup master data dasar di streampoint_race
     */
    protected function setupMasterData(): array
    {
        Setting::current()->update([
            'max_daily_rent_quota' => 3,
            'store_name' => 'StreamPoint Race',
            'accent_preset' => 'emerald',
        ]);

        $paymentMethod = PaymentMethod::create([
            'type' => PaymentMethodType::BANK,
            'label' => 'BCA',
            'account_number' => '1234567890',
            'account_holder' => 'StreamPoint Race',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $rentProduct = Product::create([
            'name' => 'Netflix Premium Race',
            'slug' => 'netflix-premium-race',
            'description' => 'Produk sewa untuk race test',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $rentVariant = ProductVariant::create([
            'product_id' => $rentProduct->id,
            'name' => '1 Hari Sewa',
            'type' => OrderType::RENT,
            'rent_duration' => RentDuration::ONE_DAY,
            'duration_hours' => 24,
            'price' => 25000,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $buyProduct = Product::create([
            'name' => 'Canva Pro Race',
            'slug' => 'canva-pro-race',
            'description' => 'Produk beli untuk race test',
            'is_active' => true,
            'sort_order' => 2,
        ]);

        $buyVariant = ProductVariant::create([
            'product_id' => $buyProduct->id,
            'name' => '1 Tahun Beli',
            'type' => OrderType::BUY,
            'rent_duration' => null,
            'duration_hours' => 8760,
            'price' => 50000,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $scenarioEVariants = [];
        for ($v = 1; $v <= 4; $v++) {
            $scenarioEVariants[] = ProductVariant::create([
                'product_id' => $rentProduct->id,
                'name' => "Sewa Varian E-{$v}",
                'type' => OrderType::RENT,
                'rent_duration' => RentDuration::ONE_DAY,
                'duration_hours' => 24,
                'price' => 20000 + ($v * 1000),
                'is_active' => true,
                'sort_order' => 10 + $v,
            ]);
        }
        for ($v = 1; $v <= 4; $v++) {
            $scenarioEVariants[] = ProductVariant::create([
                'product_id' => $buyProduct->id,
                'name' => "Beli Varian E-{$v}",
                'type' => OrderType::BUY,
                'rent_duration' => null,
                'duration_hours' => 720,
                'price' => 40000 + ($v * 1000),
                'is_active' => true,
                'sort_order' => 20 + $v,
            ]);
        }

        return compact('paymentMethod', 'rentProduct', 'rentVariant', 'buyProduct', 'buyVariant', 'scenarioEVariants');
    }

    /**
     * Bersihkan tabel transaksi di streampoint_race
     */
    protected function resetTransactionalData(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        OrderEvent::truncate();
        Order::truncate();
        ProductAccount::truncate();
        DailyQuotaOverride::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    }

    /**
     * Skenario A (kuota/unit terakhir, RENT)
     * 8 proses serentak ke varian RENT dengan 1 unit AVAILABLE.
     * Syarat: Berhasil tepat 1, gagal 7 (OutOfStockException atau QuotaFullException), unit RESERVED tepat 1.
     */
    protected function runScenarioA(int $round, array $master): array
    {
        $this->resetTransactionalData();

        Setting::current()->update(['max_daily_rent_quota' => 3]);

        // Buat tepat 1 unit RENT AVAILABLE
        ProductAccount::create([
            'product_id' => $master['rentProduct']->id,
            'kind' => OrderType::RENT,
            'credential' => 'rent_acc_single@test.com|password123',
            'status' => AccountStatus::AVAILABLE,
        ]);

        $results = $this->spawnWorkers(
            count: 8,
            variantId: $master['rentVariant']->id,
            paymentMethodId: $master['paymentMethod']->id
        );

        $success = array_filter($results, fn ($r) => ($r['success'] ?? false) === true);
        $failed = array_filter($results, fn ($r) => ($r['success'] ?? false) === false);

        $reservedAccounts = ProductAccount::where('status', AccountStatus::RESERVED)->count();
        $exceptions = array_count_values(array_column($failed, 'exception'));

        $passed = (count($success) === 1) && (count($failed) === 7) && ($reservedAccounts === 1);

        $summary = sprintf(
            'Berhasil: %d, Gagal: %d %s, Unit RESERVED: %d',
            count($success),
            count($failed),
            json_encode($exceptions),
            $reservedAccounts
        );

        return ['passed' => $passed, 'summary' => $summary];
    }

    /**
     * Skenario B (kuota global)
     * 10 proses serentak, unit RENT melimpah (15 unit), kuota = 3.
     * Syarat: Berhasil tepat 3, gagal 7 (QuotaFullException).
     */
    protected function runScenarioB(int $round, array $master): array
    {
        $this->resetTransactionalData();

        Setting::current()->update(['max_daily_rent_quota' => 3]);

        // Siapkan 15 unit AVAILABLE
        for ($i = 1; $i <= 15; $i++) {
            ProductAccount::create([
                'product_id' => $master['rentProduct']->id,
                'kind' => OrderType::RENT,
                'credential' => "rent_acc_{$i}@test.com|password123",
                'status' => AccountStatus::AVAILABLE,
            ]);
        }

        $results = $this->spawnWorkers(
            count: 10,
            variantId: $master['rentVariant']->id,
            paymentMethodId: $master['paymentMethod']->id
        );

        $success = array_filter($results, fn ($r) => ($r['success'] ?? false) === true);
        $failed = array_filter($results, fn ($r) => ($r['success'] ?? false) === false);

        $exceptions = array_count_values(array_column($failed, 'exception'));
        $quotaFullCount = $exceptions['QuotaFullException'] ?? 0;

        $passed = (count($success) === 3) && (count($failed) === 7) && ($quotaFullCount === 7);

        $summary = sprintf(
            'Berhasil: %d (harus 3), Gagal: %d (QuotaFull: %d/7)',
            count($success),
            count($failed),
            $quotaFullCount
        );

        return ['passed' => $passed, 'summary' => $summary];
    }

    /**
     * Skenario C (BUY, stok terakhir)
     * 8 proses serentak ke varian BUY dengan tepat 1 unit AVAILABLE.
     * Syarat: Berhasil tepat 1, gagal 7 (OutOfStockException), unit RESERVED tepat 1.
     */
    protected function runScenarioC(int $round, array $master): array
    {
        $this->resetTransactionalData();

        // Buat tepat 1 unit BUY AVAILABLE
        ProductAccount::create([
            'product_id' => $master['buyProduct']->id,
            'kind' => OrderType::BUY,
            'credential' => 'buy_acc_single@test.com|password123',
            'status' => AccountStatus::AVAILABLE,
        ]);

        $results = $this->spawnWorkers(
            count: 8,
            variantId: $master['buyVariant']->id,
            paymentMethodId: $master['paymentMethod']->id
        );

        $success = array_filter($results, fn ($r) => ($r['success'] ?? false) === true);
        $failed = array_filter($results, fn ($r) => ($r['success'] ?? false) === false);

        $reservedAccounts = ProductAccount::where('status', AccountStatus::RESERVED)->count();
        $exceptions = array_count_values(array_column($failed, 'exception'));
        $outOfStockCount = $exceptions['OutOfStockException'] ?? 0;

        $passed = (count($success) === 1) && (count($failed) === 7) && ($outOfStockCount === 7) && ($reservedAccounts === 1);

        $summary = sprintf(
            'Berhasil: %d, Gagal: %d (OutOfStock: %d/7), Unit RESERVED: %d',
            count($success),
            count($failed),
            $outOfStockCount,
            $reservedAccounts
        );

        return ['passed' => $passed, 'summary' => $summary];
    }

    /**
     * Skenario D (kode unik)
     * 6 proses serentak ke varian berharga sama dengan stok cukup.
     * Syarat: Semua 6 berhasil, total_amount semua order aktif harus unik (0 duplikat).
     */
    protected function runScenarioD(int $round, array $master): array
    {
        $this->resetTransactionalData();

        // Berikan kuota longgar agar tidak dibatasi kuota
        Setting::current()->update(['max_daily_rent_quota' => 20]);

        // Siapkan 10 unit AVAILABLE
        for ($i = 1; $i <= 10; $i++) {
            ProductAccount::create([
                'product_id' => $master['rentProduct']->id,
                'kind' => OrderType::RENT,
                'credential' => "rent_acc_unique_{$i}@test.com|password123",
                'status' => AccountStatus::AVAILABLE,
            ]);
        }

        $results = $this->spawnWorkers(
            count: 6,
            variantId: $master['rentVariant']->id,
            paymentMethodId: $master['paymentMethod']->id
        );

        $success = array_filter($results, fn ($r) => ($r['success'] ?? false) === true);
        $amounts = array_column($success, 'total_amount');
        $uniqueAmounts = array_unique($amounts);
        $duplicateCount = count($amounts) - count($uniqueAmounts);

        $passed = (count($success) === 6) && ($duplicateCount === 0);

        $summary = sprintf(
            'Berhasil: %d/6, Total Amount: [%s], Duplikat: %d',
            count($success),
            implode(', ', $amounts),
            $duplicateCount
        );

        return ['passed' => $passed, 'summary' => $summary];
    }

    /**
     * Skenario E (satu pesanan aktif per pembeli)
     * 8 proses serentak dengan nomor WA yang sama ke varian berbeda; tepat 1 order berhasil.
     * Syarat: Berhasil tepat 1, gagal 7 (ActiveOrderExistsException), tepat 1 order di database.
     */
    protected function runScenarioE(int $round, array $master): array
    {
        $this->resetTransactionalData();

        // Kuota longgar agar tidak membatasi
        Setting::current()->update(['max_daily_rent_quota' => 50]);

        // Siapkan unit AVAILABLE yang cukup untuk setiap varian E
        foreach ($master['scenarioEVariants'] as $variant) {
            for ($k = 1; $k <= 2; $k++) {
                ProductAccount::create([
                    'product_id' => $variant->product_id,
                    'kind' => $variant->type,
                    'credential' => "acc_e_{$variant->id}_{$k}@test.com|password123",
                    'status' => AccountStatus::AVAILABLE,
                ]);
            }
        }

        $variantIds = array_map(fn ($v) => $v->id, $master['scenarioEVariants']);

        $results = $this->spawnWorkers(
            count: 8,
            variantId: $variantIds,
            paymentMethodId: $master['paymentMethod']->id,
            samePhone: '081299998888'
        );

        $success = array_filter($results, fn ($r) => ($r['success'] ?? false) === true);
        $failed = array_filter($results, fn ($r) => ($r['success'] ?? false) === false);

        $exceptions = array_count_values(array_column($failed, 'exception'));
        $activeOrderExistsCount = $exceptions['ActiveOrderExistsException'] ?? 0;
        $orderCount = Order::count();

        $passed = (count($success) === 1) && (count($failed) === 7) && ($activeOrderExistsCount === 7) && ($orderCount === 1);

        $summary = sprintf(
            'Berhasil: %d, Gagal: %d (ActiveOrderExists: %d/7), Total Order DB: %d',
            count($success),
            count($failed),
            $activeOrderExistsCount,
            $orderCount
        );

        return ['passed' => $passed, 'summary' => $summary];
    }

    /**
     * Spawn child workers via proc_open dengan penghalang sinkronisasi
     */
    protected function spawnWorkers(int $count, int|array $variantId, int $paymentMethodId, ?string $samePhone = null): array
    {
        $scratchDir = storage_path('scratch_race_' . bin2hex(random_bytes(6)));
        if (! is_dir($scratchDir)) {
            mkdir($scratchDir, 0755, true);
        }

        $signalFile = $scratchDir . DIRECTORY_SEPARATOR . 'start.signal';
        $workers = [];

        try {
            for ($i = 1; $i <= $count; $i++) {
                $phone = $samePhone ?: ('0812345678' . str_pad((string) $i, 2, '0', STR_PAD_LEFT));
                $vId = is_array($variantId) ? $variantId[($i - 1) % count($variantId)] : $variantId;

                $cmd = [
                    PHP_BINARY,
                    base_path('artisan'),
                    'dev:race-test',
                    '--worker',
                    "--worker-id={$i}",
                    "--scratch-dir={$scratchDir}",
                    "--variant-id={$vId}",
                    "--payment-method-id={$paymentMethodId}",
                    "--phone={$phone}",
                ];

                $descriptors = [
                    0 => ['pipe', 'r'],
                    1 => ['pipe', 'w'],
                    2 => ['pipe', 'w'],
                ];

                $env = [];
                foreach ($_SERVER as $k => $v) {
                    if (is_string($v) || is_numeric($v)) {
                        $env[$k] = (string) $v;
                    }
                }
                $env['DB_DATABASE'] = 'streampoint_race';

                $proc = proc_open($cmd, $descriptors, $pipes, base_path(), $env);

                if (! is_resource($proc)) {
                    throw new RuntimeException("Gagal menjalankan worker {$i} via proc_open");
                }

                $workers[$i] = [
                    'proc' => $proc,
                    'pipes' => $pipes,
                ];
            }

            // Tunggu semua worker siap (berkas ready_X ada)
            $startWait = microtime(true);
            while (true) {
                $readyCount = count(glob($scratchDir . DIRECTORY_SEPARATOR . 'ready_*.tmp'));
                if ($readyCount >= $count) {
                    break;
                }
                if (microtime(true) - $startWait > 20) {
                    throw new RuntimeException("Timeout menunggu worker: {$readyCount} dari {$count} siap.");
                }
                usleep(2000); // 2 ms
            }

            // Jeda 10ms agar worker stabil pada loop tunggu
            usleep(10000);

            // Lepaskan penghalang sinkronisasi: semua worker mulai serentak
            touch($signalFile);

            // Tunggu seluruh worker selesai
            $execStart = microtime(true);
            while (true) {
                $allFinished = true;
                foreach ($workers as $w) {
                    $status = proc_get_status($w['proc']);
                    if ($status['running']) {
                        $allFinished = false;
                        break;
                    }
                }
                if ($allFinished) {
                    break;
                }
                if (microtime(true) - $execStart > 30) {
                    foreach ($workers as $w) {
                        proc_terminate($w['proc']);
                    }
                    throw new RuntimeException('Worker execution timeout (> 30s).');
                }
                usleep(3000); // 3 ms
            }

            // Baca output setiap worker
            $results = [];
            foreach ($workers as $i => $w) {
                $stdout = stream_get_contents($w['pipes'][1]);
                $stderr = stream_get_contents($w['pipes'][2]);
                fclose($w['pipes'][0]);
                fclose($w['pipes'][1]);
                fclose($w['pipes'][2]);
                proc_close($w['proc']);

                // Parse JSON dari baris keluaran
                $json = null;
                $lines = explode("\n", trim($stdout));
                foreach ($lines as $line) {
                    $decoded = json_decode(trim($line), true);
                    if (is_array($decoded) && isset($decoded['success'])) {
                        $json = $decoded;
                        break;
                    }
                }

                if (! $json) {
                    $results[$i] = [
                        'worker_id' => $i,
                        'success' => false,
                        'exception' => 'WorkerError',
                        'message' => "STDOUT: {$stdout} | STDERR: {$stderr}",
                    ];
                } else {
                    $results[$i] = $json;
                }
            }

            return $results;
        } finally {
            // Bersihkan berkas scratch
            if (is_dir($scratchDir)) {
                $files = glob($scratchDir . DIRECTORY_SEPARATOR . '*');
                if ($files) {
                    foreach ($files as $f) {
                        if (is_file($f)) {
                            unlink($f);
                        }
                    }
                }
                rmdir($scratchDir);
            }
        }
    }

    /**
     * Hitung record tabel pada koneksi aktif
     */
    protected function captureCounts(): array
    {
        return [
            'Product' => Product::count(),
            'ProductAccount' => ProductAccount::count(),
            'Order' => Order::count(),
            'Banner' => Banner::count(),
        ];
    }
}
