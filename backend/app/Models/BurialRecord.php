<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class BurialRecord extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'plot_id',
        'deceased_name',
        'birth_date',
        'death_date',
        'burial_date',
        'photo_url',
        'obituary',
        'notes',
        'contact_name',
        'contact_phone',
        'contact_email',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'birth_date' => 'date',
        'death_date' => 'date',
        'burial_date' => 'date',
    ];

    /**
     * Get the plot that owns the burial record.
     */
    public function plot(): BelongsTo
    {
        return $this->belongsTo(Plot::class);
    }

    /**
     * Get the QR code associated with the burial record.
     */
    public function qrCode(): HasOne
    {
        return $this->hasOne(QrCode::class);
    }

    /**
     * Calculate age at death
     */
    public function getAgeAtDeathAttribute(): ?int
    {
        if ($this->birth_date && $this->death_date) {
            return $this->birth_date->diffInYears($this->death_date);
        }
        return null;
    }
}
