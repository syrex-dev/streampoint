<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('kind'); // RENT or BUY
            $table->text('credential'); // Cast encrypted in model
            $table->string('status')->default('AVAILABLE');
            $table->unsignedBigInteger('order_id')->nullable()->index();
            $table->dateTime('rented_until')->nullable();
            $table->string('note')->nullable();
            $table->timestamps();

            $table->index(['product_id', 'kind', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_accounts');
    }
};
