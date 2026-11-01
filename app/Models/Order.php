<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_code',
        'product_id',
        'variant_id',
        'account_id',
        'order_type',
        'customer_phone',
        'customer_note',
        'payment_method_id',
        'payment_method_label',
        'base_price',
        'unique_code',
        'total_amount',
        'payment_proof_path',
        'status',
        'status_note',
        'access_starts_at',
        'access_expires_at',
        'payment_expires_at',
        'quota_date',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'order_type' => OrderType::class,
            'status' => OrderStatus::class,
            'base_price' => 'integer',
            'unique_code' => 'integer',
            'total_amount' => 'integer',
            'access_starts_at' => 'datetime',
            'access_expires_at' => 'datetime',
            'payment_expires_at' => 'datetime',
            'quota_date' => 'date:Y-m-d',
            'paid_at' => 'datetime',
        ];
    }

    public function scopeCountsTowardQuota(Builder $query): Builder
    {
        return $query->where(function (Builder $q) {
            $q->whereIn('status', [OrderStatus::VERIFYING, OrderStatus::PAID])
              ->orWhere(fn (Builder $sq) => $sq->where('status', OrderStatus::PENDING)
                                              ->where('payment_expires_at', '>', now()));
        });
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(ProductAccount::class, 'account_id');
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class, 'payment_method_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(OrderEvent::class)->orderBy('created_at');
    }
}
