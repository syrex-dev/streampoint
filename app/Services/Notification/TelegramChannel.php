<?php

namespace App\Services\Notification;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class TelegramChannel implements NotificationChannel
{
    public function send(string $message, array $options = []): void
    {
        $token = config('notify.telegram.bot_token');
        $chatId = config('notify.telegram.chat_id');

        if (! $token || ! $chatId) {
            Log::info('Telegram notification skipped: token or chat_id is empty.');
            return;
        }

        try {
            $payload = [
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => 'HTML',
                'disable_web_page_preview' => true,
            ];

            if (! empty($options['reply_markup'])) {
                $payload['reply_markup'] = $options['reply_markup'];
            }

            $response = Http::timeout(8)->retry(2, 500)->post("https://api.telegram.org/bot{$token}/sendMessage", $payload);

            if ($response->failed()) {
                Log::warning('Telegram notification failed with status ' . $response->status() . ': ' . $response->body());
            }
        } catch (Throwable $e) {
            Log::warning('Telegram notification error: ' . $e->getMessage());
        }
    }
}
