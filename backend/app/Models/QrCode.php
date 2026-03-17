<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;

class QrCode extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'burial_record_id',
        'code',
        'url',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Resolve a safe frontend base URL for public grave links.
     */
    public static function resolveFrontendBaseUrl(): string
    {
        $frontendUrl = trim((string) Config::get('app.frontend_url', ''));
        $appUrl = trim((string) Config::get('app.url', ''));

        $candidate = $frontendUrl !== '' ? $frontendUrl : $appUrl;
        $host = parse_url($candidate, PHP_URL_HOST);

        if ($candidate === '' || in_array($host, ['localhost', '127.0.0.1'], true)) {
            $candidate = 'https://himlayangpilipino.com';
        }

        return rtrim($candidate, '/');
    }

    /**
     * Build the public grave URL from a QR code value.
     */
    public static function buildPublicUrl(string $code): string
    {
        return self::resolveFrontendBaseUrl() . '/grave/' . $code;
    }

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($qrCode) {
            if (empty($qrCode->code)) {
                $qrCode->code = Str::uuid()->toString();
            }

            if (empty($qrCode->url)) {
                $qrCode->url = self::buildPublicUrl((string) $qrCode->code);
            }
        });
    }

    /**
     * Always expose normalized production-ready public URL in API responses.
     */
    public function getUrlAttribute($value): string
    {
        $code = (string) ($this->attributes['code'] ?? '');

        if ($code === '') {
            return (string) $value;
        }

        return self::buildPublicUrl($code);
    }

    /**
     * Get the burial record that owns the QR code.
     */
    public function burialRecord(): BelongsTo
    {
        return $this->belongsTo(BurialRecord::class);
    }
}
