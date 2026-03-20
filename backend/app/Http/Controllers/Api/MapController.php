<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plot;
use App\Models\BurialRecord;
use App\Models\Landmark;
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
     * Get all plot markers and landmark markers combined
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function markers()
    {
        $plots = $this->cemeteryPlotsQuery()->with('burialRecord')->get();

        $plotMarkers = $plots->map(function ($plot) {
            return [
                'id'           => $plot->id,
                'type'         => 'plot',
                'plot_number'  => $plot->plot_number,
                'section'      => $plot->section,
                'latitude'     => (float) $plot->latitude,
                'longitude'    => (float) $plot->longitude,
                'status'       => $plot->status,
                'deceased_name' => $plot->burialRecord?->deceased_name,
                'burial_date'  => $plot->burialRecord?->burial_date?->format('Y-m-d'),
            ];
        });

        $landmarkMarkers = Landmark::all()->map(function ($lm) {
            return [
                'id'        => 'lm_' . $lm->id,
                'type'      => 'landmark',
                'name'      => $lm->name,
                'latitude'  => (float) $lm->latitude,
                'longitude' => (float) $lm->longitude,
                'status'    => $lm->status,
                'notes'     => $lm->notes,
            ];
        });

        $allMarkers = $plotMarkers->merge($landmarkMarkers)->values();

        return $this->successResponse($allMarkers, 'Map markers retrieved successfully');
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
        if (!auth('sanctum')->check() || auth('sanctum')->user()->role !== 'admin') {
            return $this->errorResponse('Unauthorized. Only administrators can add plots.', 403);
        }

        $validated = $request->validate([
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

        // Always generate plot number server-side to enforce sequential numbering.
        $validated['plot_number'] = Plot::generateNextPlotNumber();

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
            return $this->errorResponse('Unauthorized. Only administrators can archive plots.', 403);
        }

        $plot = Plot::find($plotId);

        if (!$plot) {
            return $this->errorResponse('Plot not found', 404);
        }

        try {
            $plotNumber = $plot->plot_number;
            $plot->delete();

            return $this->successResponse(null, "Plot {$plotNumber} archived successfully");
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to archive plot: ' . $e->getMessage(), 500);
        }
    }

    // -----------------------------------------------------------------------
    // LANDMARK METHODS
    // -----------------------------------------------------------------------

    /**
     * Get all landmarks
     */
    public function getLandmarks()
    {
        $landmarks = Landmark::orderBy('name')->get();
        return $this->successResponse($landmarks, 'Landmarks retrieved successfully');
    }

    /**
     * Create a new landmark (admin/staff only)
     */
    public function createLandmark(Request $request)
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:100',
            'latitude'  => 'required|numeric|between:' . self::HIMS_LAT_MIN . ',' . self::HIMS_LAT_MAX,
            'longitude' => 'required|numeric|between:' . self::HIMS_LNG_MIN . ',' . self::HIMS_LNG_MAX,
            'status'    => 'required|in:open,closed,n/a,under maintenance,available,unavailable',
            'notes'     => 'nullable|string',
        ], [
            'name.required'      => 'Landmark name is required.',
            'status.required'    => 'Status is required.',
            'latitude.between'   => 'Latitude must be inside Himlayang Pilipino Memorial Park area.',
            'longitude.between'  => 'Longitude must be inside Himlayang Pilipino Memorial Park area.',
        ]);

        try {
            $landmark = Landmark::create($validated);
            return $this->successResponse([
                'id'        => 'lm_' . $landmark->id,
                'type'      => 'landmark',
                'name'      => $landmark->name,
                'latitude'  => (float) $landmark->latitude,
                'longitude' => (float) $landmark->longitude,
                'status'    => $landmark->status,
                'notes'     => $landmark->notes,
            ], 'Landmark created successfully', 201);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to create landmark: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update an existing landmark (admin/staff only)
     */
    public function updateLandmark(Request $request, $landmarkId)
    {
        $landmark = Landmark::find($landmarkId);

        if (!$landmark) {
            return $this->errorResponse('Landmark not found', 404);
        }

        $validated = $request->validate([
            'name'      => 'sometimes|required|string|max:100',
            'latitude'  => 'sometimes|required|numeric|between:' . self::HIMS_LAT_MIN . ',' . self::HIMS_LAT_MAX,
            'longitude' => 'sometimes|required|numeric|between:' . self::HIMS_LNG_MIN . ',' . self::HIMS_LNG_MAX,
            'status'    => 'sometimes|required|in:open,closed,n/a,under maintenance,available,unavailable',
            'notes'     => 'nullable|string',
        ], [
            'latitude.between'  => 'Latitude must be inside Himlayang Pilipino Memorial Park area.',
            'longitude.between' => 'Longitude must be inside Himlayang Pilipino Memorial Park area.',
        ]);

        try {
            $landmark->update($validated);
            return $this->successResponse([
                'id'        => 'lm_' . $landmark->id,
                'type'      => 'landmark',
                'name'      => $landmark->name,
                'latitude'  => (float) $landmark->latitude,
                'longitude' => (float) $landmark->longitude,
                'status'    => $landmark->status,
                'notes'     => $landmark->notes,
            ], 'Landmark updated successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to update landmark: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete a landmark (admin only)
     */
    public function deleteLandmark($landmarkId)
    {
        if (!auth('sanctum')->check() || !auth('sanctum')->user()->isAdmin()) {
            return $this->errorResponse('Unauthorized. Only administrators can archive landmarks.', 403);
        }

        $landmark = Landmark::find($landmarkId);

        if (!$landmark) {
            return $this->errorResponse('Landmark not found', 404);
        }

        try {
            $name = $landmark->name;
            $landmark->delete();
            return $this->successResponse(null, "Landmark '{$name}' archived successfully");
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to archive landmark: ' . $e->getMessage(), 500);
        }
    }
}
