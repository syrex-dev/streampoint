<?php

namespace App\Console\Commands;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Jobs\SendAdminNotification;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductAccount;
use App\Models\ProductVariant;
use App\Services\Notification\TelegramChannel;
use Illuminate\Console\Command;

class TestNotificationCommand extends Command
{
    protected $signature = 'notify:test {--event=all : order.created, payment.confirmed, or all}';
    protected $description = 'Test Telegram notification for order.created and payment.confirmed';

    public function handle(): int
    {
        if (! app()->environment('local')) {
            $this->error('Command ini hanya dapat dijalankan pada environment local.');
            return Command::FAILURE;
        }

        $token = config('notify.telegram.bot_token');
        $chatId = config('notify.telegram.chat_id');

        $this->info('--- Pengujian Notifikasi Telegram ---');
        $this->line('Bot Token: ' . ($token ? 'terisi' : 'kosong'));
        $this->line('Chat ID  : ' . ($chatId ? 'terisi' : 'kosong'));

        if (! $token || ! $chatId) {
            $this->error('Gagal: TELEGRAM_BOT_TOKEN atau TELEGRAM_CHAT_ID belum diisi di file .env.');
            $this->warn('Silakan tambahkan di .env:');
            $this->line('TELEGRAM_BOT_TOKEN=token_bot_anda');
            $this->line('TELEGRAM_CHAT_ID=chat_id_anda');
            return Command::FAILURE;
        }

        // Get an existing product & variant for realistic test
        $product = Product::first() ?? Product::create([
            'slug' => 'test-product',
            'name' => 'Netflix Premium UHD',
            'category' => 'Streaming',
            'is_active' => true,
        ]);

        $variant = $product->variants()->first() ?? ProductVariant::create([
            'product_id' => $product->id,
            'name' => 'Sewa 1 Hari (24 Jam)',
            'type' => OrderType::RENT,
            'duration_hours' => 24,
            'price' => 15000,
            'is_active' => true,
        ]);

        $account = ProductAccount::where('product_id', $product->id)->first();
        $paymentMethod = PaymentMethod::where('is_active', true)->first();

        // Create temporary test order
        $order = Order::create([
            'invoice_code' => 'INV-' . date('Ymd') . '-TEST01',
            'product_id' => $product->id,
            'variant_id' => $variant->id,
            'account_id' => $account?->id,
            'order_type' => OrderType::RENT,
            'customer_phone' => '6281234567890',
            'customer_note' => 'Uji notifikasi Telegram',
            'payment_method_id' => $paymentMethod?->id,
            'payment_method_label' => $paymentMethod?->label ?? 'QRIS',
            'base_price' => 15000,
            'unique_code' => 123,
            'total_amount' => 15123,
            'status' => OrderStatus::PENDING,
            'payment_expires_at' => now()->addMinutes(15),
            'quota_date' => now()->toDateString(),
        ]);

        try {
            $event = $this->option('event');

            if ($event === 'all' || $event === 'order.created') {
                $this->info("Mengirim notifikasi Telegram untuk event: order.created...");
                SendAdminNotification::dispatchSync('order.created', $order->id);
                $this->line("  -> Notifikasi order.created selesai dikirim.");
            }

            if ($event === 'all' || $event === 'payment.confirmed') {
                $this->info("Mengirim notifikasi Telegram untuk event: payment.confirmed...");
                SendAdminNotification::dispatchSync('payment.confirmed', $order->id);
                $this->line("  -> Notifikasi payment.confirmed selesai dikirim.");
            }
        } finally {
            $order->delete();
            $this->line("Data order uji sementara telah dibersihkan.");
        }

        return Command::SUCCESS;
    }
}
