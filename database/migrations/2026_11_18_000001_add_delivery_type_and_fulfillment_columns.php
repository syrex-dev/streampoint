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
            if (! Schema::hasColumn('product_variants', 'delivery_type')) {
                $table->string('delivery_type', 20)->default('STOCK')->after('type');
            }
            if (! Schema::hasColumn('product_variants', 'buyer_fields')) {
                $table->json('buyer_fields')->nullable()->after('delivery_type');
            }
            if (! Schema::hasColumn('product_variants', 'stock_fields')) {
                $table->json('stock_fields')->nullable()->after('buyer_fields');
            }
            if (! Schema::hasColumn('product_variants', 'delivery_instructions')) {
                $table->text('delivery_instructions')->nullable()->after('stock_fields');
            }
            if (! Schema::hasColumn('product_variants', 'eta_text')) {
                $table->string('eta_text', 60)->nullable()->after('delivery_instructions');
            }
            if (! Schema::hasColumn('product_variants', 'stock_limit')) {
                $table->unsignedInteger('stock_limit')->nullable()->after('eta_text');
            }
            $table->unsignedInteger('duration_hours')->nullable()->change();
        });

        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'buyer_inputs')) {
                $table->json('buyer_inputs')->nullable()->after('customer_note');
            }
            if (! Schema::hasColumn('orders', 'fulfillment_status')) {
                $table->string('fulfillment_status', 30)->nullable()->after('status');
            }
            if (! Schema::hasColumn('orders', 'delivery_message')) {
                $table->text('delivery_message')->nullable()->after('fulfillment_status');
            }
            if (! Schema::hasColumn('orders', 'fulfilled_at')) {
                $table->dateTime('fulfilled_at')->nullable()->after('delivery_message');
            }
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
