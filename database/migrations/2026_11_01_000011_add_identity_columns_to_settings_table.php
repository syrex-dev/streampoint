<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->string('store_name')->nullable()->after('business_hours');
            $table->string('store_logo_path')->nullable()->after('store_name');
            $table->string('accent_preset')->default('emerald')->after('store_logo_path');
        });
    }

    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn(['store_name', 'store_logo_path', 'accent_preset']);
        });
    }
};
