<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('cover_path')->nullable()->after('thumbnail_path');
            $table->boolean('has_warranty')->default(false)->after('brand_color');
        });

        Schema::table('settings', function (Blueprint $table) {
            $table->string('announcement_text', 160)->nullable()->after('accent_preset');
            $table->string('announcement_url', 255)->nullable()->after('announcement_text');
            $table->boolean('announcement_active')->default(false)->after('announcement_url');
            $table->string('store_tagline', 60)->nullable()->after('announcement_active');
            $table->string('delivery_eta', 60)->nullable()->after('store_tagline');
            $table->unsignedSmallInteger('min_sold_display')->default(5)->after('delivery_eta');
            $table->boolean('custom_request_enabled')->default(false)->after('min_sold_display');
            $table->json('social_links')->nullable()->after('custom_request_enabled');
        });

        Schema::table('payment_methods', function (Blueprint $table) {
            $table->string('logo_path')->nullable()->after('qris_image_path');
        });
    }

    public function down(): void
    {
        Schema::table('payment_methods', function (Blueprint $table) {
            $table->dropColumn(['logo_path']);
        });

        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn([
                'announcement_text',
                'announcement_url',
                'announcement_active',
                'store_tagline',
                'delivery_eta',
                'min_sold_display',
                'custom_request_enabled',
                'social_links',
            ]);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['cover_path', 'has_warranty']);
        });
    }
};
