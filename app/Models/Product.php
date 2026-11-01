<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'name',
        'category',
        'thumbnail_path',
        'description',
        'rules',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class)->orderBy('sort_order');
    }

    public function accounts(): HasMany
    {
        return $this->hasMany(ProductAccount::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
