<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('orders:expire')->everyMinute();
Schedule::command('accounts:release-rented')->everyFiveMinutes();
Schedule::command('orders:remind-verifying')->everyFiveMinutes();
