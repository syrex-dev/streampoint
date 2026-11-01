<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Active Notification Channels
    |--------------------------------------------------------------------------
    |
    | Comma-separated or array of active notification channels.
    | e.g. "telegram", "telegram,fonnte"
    |
    */
    'channels' => ! empty(env('NOTIFY_CHANNELS'))
        ? array_filter(array_map('trim', explode(',', (string) env('NOTIFY_CHANNELS'))))
        : ['telegram'],

    /*
    |--------------------------------------------------------------------------
    | Telegram Configuration
    |--------------------------------------------------------------------------
    */
    'telegram' => [
        'bot_token' => env('TELEGRAM_BOT_TOKEN'),
        'chat_id' => env('TELEGRAM_CHAT_ID'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Fonnte WhatsApp Configuration
    |--------------------------------------------------------------------------
    */
    'fonnte' => [
        'token' => env('FONNTE_TOKEN'),
        'target' => env('FONNTE_TARGET'),
    ],
];
