<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_code')->unique();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('variant_id')->constrained('product_variants')->cascadeOnDelete();
            $table->foreignId('account_id')->nullable()->constrained('product_accounts')->nullOnDelete();
            $table->string('order_type'); // RENT or BUY
            $table->string('customer_phone');
            $table->string('customer_note')->nullable();
            $table->foreignId('payment_method_id')->nullable()->constrained('payment_methods')->nullOnDelete();
            $table->string('payment_method_label');
            $table->unsignedInteger('base_price');
            $table->unsignedSmallInteger('unique_code')->default(0);
            $table->unsignedInteger('total_amount');
            $table->string('payment_proof_path')->nullable();
            $table->string('status')->default('PENDING');
            $table->string('status_note')->nullable();
            $table->dateTime('access_starts_at')->nullable();
            $table->dateTime('access_expires_at')->nullable();
            $table->dateTime('payment_expires_at');
            $table->date('quota_date');
            $table->dateTime('paid_at')->nullable();
            $table->timestamps();

            $table->index(['quota_date', 'order_type', 'status']);
            $table->index(['status', 'payment_expires_at']);
            $table->index('customer_phone');
            $table->index('total_amount');
        });

        // Add foreign key constraint to product_accounts now that orders table exists
        Schema::table('product_accounts', function (Blueprint $table) {
            $table->foreign('order_id')->references('id')->on('orders')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('product_accounts', function (Blueprint $table) {
            $table->dropForeign(['order_id']);
        });

        Schema::dropIfExists('orders');
    }
};
