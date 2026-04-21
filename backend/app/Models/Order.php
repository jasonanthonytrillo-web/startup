<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'customer_name',
        'order_type',
        'status',
        'payment_method',
        'queue_position',
        'total',
        'accepted_at',
    ];

    protected $casts = [
        'total' => 'decimal:2',
        'accepted_at' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Generate a unique random order number like MK-123456
     */
    public static function generateOrderNumber(): string
    {
        do {
            $number = 'MK-' . rand(100000, 999999);
        } while (static::where('order_number', $number)->exists());

        return $number;
    }
}
