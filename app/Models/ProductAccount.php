<?php

namespace App\Models;

use App\Enums\AccountStatus;
use App\Enums\OrderType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'kind',
        'credential',
        'status',
        'order_id',
        'rented_until',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'kind' => OrderType::class,
            'credential' => 'encrypted',
            'status' => AccountStatus::class,
            'rented_until' => 'datetime',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
