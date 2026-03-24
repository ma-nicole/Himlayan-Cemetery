<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Payment;

class ServiceRequest extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'service_type',
        'product_type',
        'price_range',
        'description',
        'preferred_date',
        'contact_number',
        'body_weight',
        'body_height',
        'body_width',
        'status',
        'admin_notes',
        'service_fee_amount',
        'processed_by',
        'processed_at',
    ];

    protected $casts = [
        'preferred_date' => 'date',
        'processed_at' => 'datetime',
        'service_fee_amount' => 'decimal:2',
        'body_weight' => 'decimal:1',
        'body_height' => 'decimal:1',
        'body_width' => 'decimal:1',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    public function serviceFeePayment()
    {
        return $this->hasOne(Payment::class, 'service_request_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function processor()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }
}
