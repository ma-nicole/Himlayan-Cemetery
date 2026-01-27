<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plot;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PlotController extends Controller
{
    /**
     * Display a listing of plots
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $query = Plot::with('burialRecord');

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by section
        if ($request->has('section')) {
            $query->where('section', $request->section);
        }

        // Search by plot number
        if ($request->has('search')) {
            $query->where('plot_number', 'like', '%' . $request->search . '%');
        }

        $plots = $query->orderBy('section')
                       ->orderBy('row_number')
                       ->orderBy('column_number')
                       ->paginate($request->per_page ?? 15);

        return $this->successResponse($plots, 'Plots retrieved successfully');
    }

    /**
     * Store a newly created plot
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'plot_number' => 'required|string|unique:plots,plot_number',
            'section' => 'nullable|string|max:50',
            'row_number' => 'nullable|integer|min:1',
            'column_number' => 'nullable|integer|min:1',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'status' => ['nullable', Rule::in(['available', 'occupied', 'reserved', 'maintenance'])],
            'notes' => 'nullable|string',
        ]);

        $plot = Plot::create($validated);

        return $this->successResponse($plot, 'Plot created successfully', 201);
    }

    /**
     * Display the specified plot
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        $plot = Plot::with('burialRecord.qrCode')->find($id);

        if (!$plot) {
            return $this->errorResponse('Plot not found', 404);
        }

        return $this->successResponse($plot, 'Plot retrieved successfully');
    }

    /**
     * Update the specified plot
     * 
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        $plot = Plot::find($id);

        if (!$plot) {
            return $this->errorResponse('Plot not found', 404);
        }

        $validated = $request->validate([
            'plot_number' => ['sometimes', 'string', Rule::unique('plots')->ignore($id)],
            'section' => 'nullable|string|max:50',
            'row_number' => 'nullable|integer|min:1',
            'column_number' => 'nullable|integer|min:1',
            'latitude' => 'sometimes|numeric|between:-90,90',
            'longitude' => 'sometimes|numeric|between:-180,180',
            'status' => ['nullable', Rule::in(['available', 'occupied', 'reserved', 'maintenance'])],
            'notes' => 'nullable|string',
        ]);

        $plot->update($validated);

        return $this->successResponse($plot, 'Plot updated successfully');
    }

    /**
     * Remove the specified plot
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        $plot = Plot::find($id);

        if (!$plot) {
            return $this->errorResponse('Plot not found', 404);
        }

        // Check if plot has burial record
        if ($plot->burialRecord) {
            return $this->errorResponse('Cannot delete plot with burial record. Remove burial record first.', 400);
        }

        $plot->delete();

        return $this->successResponse(null, 'Plot deleted successfully');
    }

    /**
     * Get available plots
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function available()
    {
        $plots = Plot::available()
                     ->orderBy('section')
                     ->orderBy('row_number')
                     ->orderBy('column_number')
                     ->get();

        return $this->successResponse($plots, 'Available plots retrieved successfully');
    }

    /**
     * Get plot statistics
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function statistics()
    {
        $stats = [
            'total' => Plot::count(),
            'available' => Plot::where('status', 'available')->count(),
            'occupied' => Plot::where('status', 'occupied')->count(),
            'reserved' => Plot::where('status', 'reserved')->count(),
            'maintenance' => Plot::where('status', 'maintenance')->count(),
        ];

        return $this->successResponse($stats, 'Plot statistics retrieved successfully');
    }

    /**
     * Get plots belonging to current user (member)
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function myPlots()
    {
        $user = auth()->user();
        
        // For now, return empty array as we don't have owner_id on plots yet
        // In production, you would filter by user_id
        $plots = Plot::where('owner_id', $user->id)
                     ->with('burialRecord')
                     ->orderBy('section')
                     ->get();

        return $this->successResponse($plots, 'My plots retrieved successfully');
    }
}
