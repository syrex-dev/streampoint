<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->boolean('telegram_active')->default(false)->after('social_links');
            $table->text('telegram_bot_token')->nullable()->after('telegram_active');
            $table->text('telegram_chat_id')->nullable()->after('telegram_bot_token');
        });
    }

    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn(['telegram_active', 'telegram_bot_token', 'telegram_chat_id']);
        });
    }
};

