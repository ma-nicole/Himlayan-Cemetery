<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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
        'owner_id',
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
     * Get the owner of the plot.
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
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

    /**
     * Generate the next plot number based on the latest numeric sequence.
     */
    public static function generateNextPlotNumber(): string
    {
        $plotNumbers = static::withTrashed()->pluck('plot_number');

        $highestNumber = 0;
        $prefix = 'PLOT-';
        $padding = 3;

        foreach ($plotNumbers as $plotNumber) {
            if (!is_string($plotNumber)) {
                continue;
            }

            if (preg_match('/^(.*?)(\d+)$/', trim($plotNumber), $matches)) {
                $currentPrefix = $matches[1] !== '' ? $matches[1] : $prefix;
                $currentNumber = (int) $matches[2];
                $currentPadding = strlen($matches[2]);

                if ($currentNumber > $highestNumber) {
                    $highestNumber = $currentNumber;
                    $prefix = $currentPrefix;
                    $padding = max(3, $currentPadding);
                }
            }
        }

        $nextNumber = $highestNumber + 1;

        return $prefix . str_pad((string) $nextNumber, $padding, '0', STR_PAD_LEFT);
    }
}
