<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailyQuotaOverride extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'max_quota',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'max_quota' => 'integer',
        ];
    }
}
