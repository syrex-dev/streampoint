<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'order_id',
        'variant_id',
        'customer_phone',
        'customer_name',
        'rating',
        'comment',
        'is_visible',
    ];

    protected $casts = [
        'rating' => 'integer',
        'is_visible' => 'boolean',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    /**
     * Mask customer phone number for privacy and anti-doxxing, e.g. 0812****7890.
     */
    public function getMaskedPhoneAttribute(): string
    {
        $phone = $this->customer_phone;
        if (strlen($phone) > 7) {
            return substr($phone, 0, 4) . '****' . substr($phone, -4);
        }
        return 'Pembeli';
    }
}
