<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plot;
use App\Models\BurialRecord;
use Illuminate\Http\Request;

class MapController extends Controller
{
    private const HIMS_LAT_MIN = 14.6796000;
    private const HIMS_LAT_MAX = 14.6858000;
    private const HIMS_LNG_MIN = 121.0500000;
    private const HIMS_LNG_MAX = 121.0552000;

    private function cemeteryPlotsQuery()
    {
        return Plot::whereBetween('latitude', [self::HIMS_LAT_MIN, self::HIMS_LAT_MAX])
            ->whereBetween('longitude', [self::HIMS_LNG_MIN, self::HIMS_LNG_MAX]);
    }

    /**
     * Get all map markers for cemetery view
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function markers()
    {
        $plots = $this->cemeteryPlotsQuery()->with('burialRecord')->get();

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
        $plot = $this->cemeteryPlotsQuery()->with('burialRecord.qrCode')->find($plotId);

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
        $plots = $this->cemeteryPlotsQuery()->get();

        if ($plots->isEmpty()) {
            return $this->successResponse([
                'center' => ['lat' => 14.682462, 'lng' => 121.0530409],
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

    /**
     * Create a new plot
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function createPlot(Request $request)
    {
        $validated = $request->validate([
            'plot_number' => 'required|string|unique:plots,plot_number',
            'section' => 'required|string|max:50',
            'row_number' => 'required|integer|min:1',
            'column_number' => 'required|integer|min:1',
            'latitude' => 'required|numeric|between:' . self::HIMS_LAT_MIN . ',' . self::HIMS_LAT_MAX,
            'longitude' => 'required|numeric|between:' . self::HIMS_LNG_MIN . ',' . self::HIMS_LNG_MAX,
            'status' => 'required|in:available,occupied,reserved,maintenance',
            'notes' => 'required|string',
        ], [
            'section.required' => 'Section is required.',
            'row_number.required' => 'Row number is required.',
            'column_number.required' => 'Column number is required.',
            'status.required' => 'Status is required.',
            'notes.required' => 'Notes is required.',
            'latitude.between' => 'Latitude must be inside Himlayang Pilipino Memorial Park area.',
            'longitude.between' => 'Longitude must be inside Himlayang Pilipino Memorial Park area.',
        ]);

        try {
            $plot = Plot::create($validated);

            return $this->successResponse([
                'id' => $plot->id,
                'plot_number' => $plot->plot_number,
                'section' => $plot->section,
                'latitude' => (float) $plot->latitude,
                'longitude' => (float) $plot->longitude,
                'status' => $plot->status,
            ], 'Plot created successfully', 201);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to create plot: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete a plot (admin only)
     * 
     * @param int $plotId
     * @return \Illuminate\Http\JsonResponse
     */
    public function deletePlot($plotId)
    {
        // Check if user is admin
        if (!auth('sanctum')->check() || !auth('sanctum')->user()->isAdmin()) {
            return $this->errorResponse('Unauthorized. Only administrators can delete plots.', 403);
        }

        $plot = Plot::find($plotId);

        if (!$plot) {
            return $this->errorResponse('Plot not found', 404);
        }

        try {
            $plotNumber = $plot->plot_number;
            $plot->forceDelete();

            return $this->successResponse(null, "Plot {$plotNumber} deleted successfully");
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to delete plot: ' . $e->getMessage(), 500);
        }
    }
}
