<?php

namespace App\Services\Notification;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class TelegramChannel implements NotificationChannel
{
    public function send(string $message, array $options = []): void
    {
        $setting = Setting::current();

        $token = ! empty($setting->telegram_bot_token)
            ? $setting->telegram_bot_token
            : config('notify.telegram.bot_token');

        $chatIdRaw = ! empty($setting->telegram_chat_id)
            ? $setting->telegram_chat_id
            : config('notify.telegram.chat_id');

        $hasDbConfig = ! empty($setting->telegram_bot_token);
        if ($hasDbConfig && ! $setting->telegram_active) {
            Log::info('Telegram notification skipped: Telegram integration is deactivated in admin settings.');
            return;
        }

        if (! $token || ! $chatIdRaw) {
            if (app()->environment(['local', 'testing'])) {
                Log::info('Telegram notification skipped (token or chat_id is empty). Message: ' . strip_tags($message));
            } else {
                Log::info('Telegram notification skipped: bot_token or chat_id is not configured.');
            }
            return;
        }

        $chatIds = array_filter(array_map('trim', preg_split('/[\r\n,]+/', (string) $chatIdRaw)));
        if (empty($chatIds)) {
            $chatIds = [trim((string) $chatIdRaw)];
        }

        foreach ($chatIds as $chatId) {
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
}
