<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plot;
use App\Models\BurialRecord;
use Illuminate\Http\Request;

class MapController extends Controller
{
    /**
     * Get all map markers for cemetery view
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function markers()
    {
        $plots = Plot::with('burialRecord')->get();

        $markers = $plots->map(function ($plot) {
            return [
                'id' => $plot->id,
                'plot_number' => $plot->plot_number,
                'section' => $plot->section,
                'latitude' => (float) $plot->latitude,
                'longitude' => (float) $plot->longitude,
                'status' => $plot->status,
                'deceased_name' => $plot->burialRecord?->deceased_name,
                'burial_date' => $plot->burialRecord?->burial_date?->format('Y-m-d'),
            ];
        });

        return $this->successResponse($markers, 'Map markers retrieved successfully');
    }

    /**
     * Get specific marker details
     * 
     * @param int $plotId
     * @return \Illuminate\Http\JsonResponse
     */
    public function markerDetails($plotId)
    {
        $plot = Plot::with('burialRecord.qrCode')->find($plotId);

        if (!$plot) {
            return $this->errorResponse('Plot not found', 404);
        }

        $data = [
            'plot' => [
                'id' => $plot->id,
                'plot_number' => $plot->plot_number,
                'section' => $plot->section,
                'row' => $plot->row_number,
                'column' => $plot->column_number,
                'latitude' => (float) $plot->latitude,
                'longitude' => (float) $plot->longitude,
                'status' => $plot->status,
            ],
            'burial_record' => null,
        ];

        if ($plot->burialRecord) {
            $record = $plot->burialRecord;
            $data['burial_record'] = [
                'id' => $record->id,
                'deceased_name' => $record->deceased_name,
                'birth_date' => $record->birth_date?->format('Y-m-d'),
                'death_date' => $record->death_date?->format('Y-m-d'),
                'burial_date' => $record->burial_date?->format('Y-m-d'),
                'photo_url' => $record->photo_url,
                'has_qr_code' => $record->qrCode !== null,
            ];
        }

        return $this->successResponse($data, 'Marker details retrieved successfully');
    }

    /**
     * Get map bounds/center from all plots
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function bounds()
    {
        $plots = Plot::all();

        if ($plots->isEmpty()) {
            return $this->successResponse([
                'center' => ['lat' => 14.5547, 'lng' => 121.0244],
                'zoom' => 17,
            ], 'Default map bounds');
        }

        $lats = $plots->pluck('latitude');
        $lngs = $plots->pluck('longitude');

        $center = [
            'lat' => ($lats->min() + $lats->max()) / 2,
            'lng' => ($lngs->min() + $lngs->max()) / 2,
        ];

        return $this->successResponse([
            'center' => $center,
            'zoom' => 18,
            'bounds' => [
                'north' => (float) $lats->max(),
                'south' => (float) $lats->min(),
                'east' => (float) $lngs->max(),
                'west' => (float) $lngs->min(),
            ],
        ], 'Map bounds retrieved successfully');
    }
}
