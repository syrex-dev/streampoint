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
            if (app()->environment(['local', 'testing'])) {
                Log::info('Telegram notification skipped (token or chat_id is empty). Message: ' . strip_tags($message));
            } else {
                Log::info('Telegram notification skipped: bot_token or chat_id is not configured.');
            }
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
                if (app()->environment(['local', 'testing'])) {
                    Log::warning('Telegram notification failed with status ' . $response->status() . ': ' . $response->body());
                } else {
                    Log::warning('Telegram notification failed with HTTP status ' . $response->status());
                }
            }
        } catch (Throwable $e) {
            if (app()->environment(['local', 'testing'])) {
                Log::warning('Telegram notification error: ' . $e->getMessage());
            } else {
                Log::warning('Telegram notification error: An exception occurred during transmission.');
            }
        }
    }
}
