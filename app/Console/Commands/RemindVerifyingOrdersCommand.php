<?php

namespace App\Console\Commands;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Services\Notification\TelegramChannel;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RemindVerifyingOrdersCommand extends Command
{
    protected $signature = 'orders:remind-verifying';

    protected $description = 'Kirim notifikasi pengingat Telegram untuk pesanan berstatus VERIFYING lebih dari 30 menit';

    public function handle(TelegramChannel $telegramChannel): int
    {
        $orders = Order::with(['product', 'variant', 'events'])
            ->where('status', OrderStatus::VERIFYING)
            ->get();

        $remindedCount = 0;

        foreach ($orders as $order) {
            // Find when order entered VERIFYING
            $verifyingEvent = $order->events
                ->where('to_status', OrderStatus::VERIFYING)
                ->sortByDesc('created_at')
                ->first();

            $verifyingSince = $verifyingEvent ? $verifyingEvent->created_at : $order->updated_at;

            // Must be in VERIFYING for more than 30 minutes
            if (! $verifyingSince || $verifyingSince->gt(now()->subMinutes(30))) {
                continue;
            }

            // Must only notify once per order
            $alreadyReminded = $order->events
                ->where('actor', 'system')
                ->filter(fn ($e) => str_contains((string) $e->note, 'Pengingat verifikasi'))
                ->isNotEmpty();

            if ($alreadyReminded) {
                continue;
            }

            // Send notification and record event atomically
            DB::transaction(function () use ($order, $telegramChannel) {
                $invoice = htmlspecialchars($order->invoice_code, ENT_QUOTES, 'UTF-8');
                $service = htmlspecialchars($order->product?->name ?? '-', ENT_QUOTES, 'UTF-8');
                $variant = htmlspecialchars($order->variant?->name ?? '-', ENT_QUOTES, 'UTF-8');
                $total = 'Rp ' . number_format($order->total_amount, 0, ',', '.');
                $phone = htmlspecialchars($order->customer_phone, ENT_QUOTES, 'UTF-8');

                $message = "⏰ <b>Pengingat Verifikasi Pesanan (> 30 Menit)</b>\n"
                    . "Invoice: <code>{$invoice}</code>\n"
                    . "Layanan: {$service}\n"
                    . "Paket: {$variant}\n"
                    . "Total: {$total}\n"
                    . "WA: {$phone}\n"
                    . "Status: Pembeli sudah konfirmasi bayar lebih dari 30 menit yang lalu. Harap segera periksa di panel admin.";

                $telegramChannel->send($message);

                $order->events()->create([
                    'from_status' => OrderStatus::VERIFYING,
                    'to_status' => OrderStatus::VERIFYING,
                    'actor' => 'system',
                    'note' => 'Pengingat verifikasi pesanan > 30 menit dikirim ke admin.',
                ]);
            });

            $remindedCount++;
        }

        $this->info("Berhasil mengirim pengingat untuk {$remindedCount} pesanan VERIFYING.");

        return Command::SUCCESS;
    }
}
