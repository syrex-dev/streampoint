<?php

namespace App\Services\Notification;

interface NotificationChannel
{
    public function send(string $message, array $options = []): void;
}
