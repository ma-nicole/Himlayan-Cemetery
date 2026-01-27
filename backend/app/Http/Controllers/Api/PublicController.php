<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QrCode;
use App\Models\BurialRecord;
use Illuminate\Http\Request;

class PublicController extends Controller
{
    /**
     * Get public grave profile by QR code
     * 
     * @param string $code
     * @return \Illuminate\Http\JsonResponse
     */
    public function graveProfile($code)
    {
        $qrCode = QrCode::with('burialRecord.plot')
                        ->where('code', $code)
                        ->where('is_active', true)
                        ->first();

        if (!$qrCode || !$qrCode->burialRecord) {
            return $this->errorResponse('Grave not found or QR code is inactive', 404);
        }

        $record = $qrCode->burialRecord;
        $plot = $record->plot;

        return $this->successResponse([
            'deceased_name' => $record->deceased_name,
            'birth_date' => $record->birth_date?->format('F d, Y'),
            'death_date' => $record->death_date?->format('F d, Y'),
            'age_at_death' => $record->age_at_death,
            'burial_date' => $record->burial_date?->format('F d, Y'),
            'obituary' => $record->obituary,
            'photo_url' => $record->photo_url,
            'location' => [
                'plot_number' => $plot->plot_number,
                'section' => $plot->section,
                'latitude' => (float) $plot->latitude,
                'longitude' => (float) $plot->longitude,
            ],
        ], 'Grave profile retrieved successfully');
    }

    /**
     * Search for burial records publicly
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function search(Request $request)
    {
        $query = $request->get('q', '');
        
        if (strlen($query) < 2) {
            return $this->successResponse([], 'Search query too short');
        }

        $results = BurialRecord::with('plot')
            ->where('deceased_name', 'LIKE', "%{$query}%")
            ->orderBy('deceased_name')
            ->limit(20)
            ->get()
            ->map(function ($record) {
                return [
                    'id' => $record->id,
                    'deceased_name' => $record->deceased_name,
                    'birth_date' => $record->birth_date?->format('Y-m-d'),
                    'death_date' => $record->death_date?->format('Y-m-d'),
                    'plot' => $record->plot ? [
                        'id' => $record->plot->id,
                        'plot_number' => $record->plot->plot_number,
                        'section' => $record->plot->section,
                        'block' => $record->plot->block,
                        'unique_code' => $record->plot->unique_code,
                    ] : null,
                ];
            });

        return $this->successResponse($results, 'Search results retrieved');
    }

    /**
     * Get public announcements
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function announcements()
    {
        // For now, return static announcements
        // In production, this would come from a database
        $announcements = [
            [
                'id' => 1,
                'title' => 'Bukas ang Sementeryo ng Undas',
                'content' => 'Oct 31 - Nov 2: 24 hours open para sa pagdalaw sa mga mahal sa buhay.',
                'date' => '2025-10-25'
            ],
            [
                'id' => 2,
                'title' => 'Bagong Memorial Garden Section',
                'content' => 'Bagong section ng memorial garden ay bukas na para sa reservation. May special discounts para sa early reservations.',
                'date' => '2025-10-01'
            ],
            [
                'id' => 3,
                'title' => 'Maintenance Schedule',
                'content' => 'Regular maintenance ng lawn areas every Tuesday at Thursday, 6AM-8AM.',
                'date' => '2025-09-15'
            ]
        ];

        return $this->successResponse($announcements, 'Announcements retrieved');
    }
}
