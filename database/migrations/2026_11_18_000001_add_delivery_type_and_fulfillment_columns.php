<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->string('delivery_type', 20)->default('STOCK')->after('type');
            $table->json('buyer_fields')->nullable()->after('delivery_type');
            $table->json('stock_fields')->nullable()->after('buyer_fields');
            $table->text('delivery_instructions')->nullable()->after('stock_fields');
            $table->string('eta_text', 60)->nullable()->after('delivery_instructions');
            $table->unsignedInteger('stock_limit')->nullable()->after('eta_text');
            $table->unsignedInteger('duration_hours')->nullable()->change();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->json('buyer_inputs')->nullable()->after('customer_note');
            $table->string('fulfillment_status', 30)->nullable()->after('status');
            $table->text('delivery_message')->nullable()->after('fulfillment_status');
            $table->dateTime('fulfilled_at')->nullable()->after('delivery_message');
        });

        // Backfill existing variants with default STOCK delivery type and standard Account stock_fields
        DB::table('product_variants')->whereNull('delivery_type')->orWhere('delivery_type', '')->update([
            'delivery_type' => 'STOCK',
        ]);

        DB::table('product_variants')->whereNull('stock_fields')->update([
            'stock_fields' => json_encode([
                ['key' => 'email', 'label' => 'Email', 'secret' => false],
                ['key' => 'password', 'label' => 'Password', 'secret' => true],
                ['key' => 'profile', 'label' => 'Profil', 'secret' => false],
                ['key' => 'pin', 'label' => 'PIN', 'secret' => true],
            ]),
        ]);
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['buyer_inputs', 'fulfillment_status', 'delivery_message', 'fulfilled_at']);
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropColumn(['delivery_type', 'buyer_fields', 'stock_fields', 'delivery_instructions', 'eta_text', 'stock_limit']);
            $table->unsignedInteger('duration_hours')->nullable(false)->change();
        });
    }
};
