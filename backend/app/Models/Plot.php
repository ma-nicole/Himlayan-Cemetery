<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Plot extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'plot_number',
        'section',
        'row_number',
        'column_number',
        'latitude',
        'longitude',
        'status',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'row_number' => 'integer',
        'column_number' => 'integer',
    ];

    /**
     * Get the burial record associated with the plot.
     */
    public function burialRecord(): HasOne
    {
        return $this->hasOne(BurialRecord::class);
    }

    /**
     * Check if plot is available
     */
    public function isAvailable(): bool
    {
        return $this->status === 'available';
    }

    /**
     * Scope to get available plots
     */
    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }

    /**
     * Scope to get occupied plots
     */
    public function scopeOccupied($query)
    {
        return $query->where('status', 'occupied');
    }
}
