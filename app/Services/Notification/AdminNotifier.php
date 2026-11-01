<?php

namespace App\Services\Notification;

use Illuminate\Support\Facades\Log;
use Throwable;

class AdminNotifier
{
    /**
     * @var array<string, NotificationChannel>
     */
    protected array $channels = [];

    public function __construct()
    {
        $this->channels = [
            'telegram' => app(TelegramChannel::class),
        ];
    }

    public function registerChannel(string $name, NotificationChannel $channel): void
    {
        $this->channels[$name] = $channel;
    }

    public function send(string $message, array $options = []): void
    {
        $activeChannels = config('notify.channels', ['telegram']);

        foreach ($activeChannels as $channelName) {
            if (isset($this->channels[$channelName])) {
                try {
                    $this->channels[$channelName]->send($message, $options);
                } catch (Throwable $e) {
                    Log::warning("Notification channel [{$channelName}] failed: " . $e->getMessage());
                }
            }
        }
    }
}
