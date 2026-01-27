<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'plot_id',
        'amount',
        'payment_type',
        'payment_method',
        'reference_number',
        'status',
        'notes',
        'paid_at',
        'verified_by',
        'verified_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
        'verified_at' => 'datetime',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_VERIFIED = 'verified';
    const STATUS_REJECTED = 'rejected';

    const TYPE_ANNUAL_MAINTENANCE = 'annual_maintenance';
    const TYPE_QUARTERLY_DUES = 'quarterly_dues';
    const TYPE_PLOT_PURCHASE = 'plot_purchase';
    const TYPE_SERVICE_FEE = 'service_fee';

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function plot()
    {
        return $this->belongsTo(Plot::class);
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }
}
