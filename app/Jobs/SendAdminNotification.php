<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\Notification\AdminNotifier;
use App\Services\QuotaService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class SendAdminNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    /**
     * @return array<int, int>
     */
    public function backoff(): array
    {
        return [10, 60];
    }

    public function __construct(
        public string $event,
        public int|string $orderIdOrMessage
    ) {}

    public function handle(AdminNotifier $notifier, QuotaService $quotaService): void
    {
        if ($this->event === 'order.created') {
            $order = Order::with(['product', 'variant'])->find($this->orderIdOrMessage);
            if (! $order) {
                Log::warning("SendAdminNotification: Order #{$this->orderIdOrMessage} not found.");
                return;
            }

            $invoice = htmlspecialchars($order->invoice_code, ENT_QUOTES, 'UTF-8');
            $service = htmlspecialchars($order->product?->name ?? '-', ENT_QUOTES, 'UTF-8');
            $variant = htmlspecialchars($order->variant?->name ?? '-', ENT_QUOTES, 'UTF-8');
            $total = 'Rp ' . number_format($order->total_amount, 0, ',', '.');
            $phone = htmlspecialchars($order->customer_phone, ENT_QUOTES, 'UTF-8');

            $snapshot = $quotaService->snapshot();
            $quotaRemaining = $snapshot['remaining'] . '/' . $snapshot['limit'];

            $message = "🛒 <b>Order Baru</b>\n"
                . "Invoice: <code>{$invoice}</code>\n"
                . "Layanan: {$service}\n"
                . "Paket: {$variant}\n"
                . "Total: {$total}\n"
                . "WA: {$phone}\n"
                . "Sisa slot sewa hari ini: {$quotaRemaining}";

            if (! empty($order->customer_note)) {
                $note = htmlspecialchars($order->customer_note, ENT_QUOTES, 'UTF-8');
                $message .= "\nCatatan: {$note}";
            }

            $notifier->send($message);
            return;
        }

        if ($this->event === 'payment.confirmed') {
            $order = Order::with(['product', 'variant'])->find($this->orderIdOrMessage);
            if (! $order) {
                Log::warning("SendAdminNotification: Order #{$this->orderIdOrMessage} not found.");
                return;
            }

            $invoice = htmlspecialchars($order->invoice_code, ENT_QUOTES, 'UTF-8');
            $service = htmlspecialchars($order->product?->name ?? '-', ENT_QUOTES, 'UTF-8');
            $variant = htmlspecialchars($order->variant?->name ?? '-', ENT_QUOTES, 'UTF-8');
            $total = 'Rp ' . number_format($order->total_amount, 0, ',', '.');
            $phone = htmlspecialchars($order->customer_phone, ENT_QUOTES, 'UTF-8');

            $message = "✅ <b>Pembayaran Dikonfirmasi</b>\n"
                . "Invoice: <code>{$invoice}</code>\n"
                . "Layanan: {$service}\n"
                . "Paket: {$variant}\n"
                . "Total: {$total}\n"
                . "WA: {$phone}\n"
                . "Status: Pembayaran Terverifikasi & Akun Aktif";

            $notifier->send($message);
            return;
        }

        if ($this->event === 'raw') {
            $notifier->send((string) $this->orderIdOrMessage);
            return;
        }

        // Generic event fallback
        $notifier->send("<b>Notifikasi Sistem</b>\nEvent: " . htmlspecialchars($this->event, ENT_QUOTES, 'UTF-8'));
    }

    public function failed(?Throwable $exception): void
    {
        Log::warning('SendAdminNotification job permanently failed: ' . ($exception?->getMessage() ?? 'unknown error'));
    }
}
