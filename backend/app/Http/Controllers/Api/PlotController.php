<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plot;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PlotController extends Controller
{
    private const HIMS_LAT_MIN = 14.6796000;
    private const HIMS_LAT_MAX = 14.6858000;
    private const HIMS_LNG_MIN = 121.0500000;
    private const HIMS_LNG_MAX = 121.0552000;

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

        // Handle sorting
        $sortBy = $request->input('sort_by', 'plot_number');
        $sortOrder = $request->input('sort_order', 'asc');
        
        // Whitelist allowed sort fields for security
        $allowedSortFields = ['plot_number', 'section', 'status', 'row_number', 'column_number', 'created_at'];
        if (!in_array($sortBy, $allowedSortFields)) {
            $sortBy = 'plot_number';
        }
        
        // Validate sort order
        if (!in_array(strtolower($sortOrder), ['asc', 'desc'])) {
            $sortOrder = 'asc';
        }

        $plots = $query->orderBy($sortBy, strtoupper($sortOrder))
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
            'section' => 'required|string|max:50',
            'row_number' => 'required|integer',
            'column_number' => 'required|integer',
            'latitude' => 'required|numeric|between:' . self::HIMS_LAT_MIN . ',' . self::HIMS_LAT_MAX,
            'longitude' => 'required|numeric|between:' . self::HIMS_LNG_MIN . ',' . self::HIMS_LNG_MAX,
            'status' => ['required', Rule::in(['available', 'occupied', 'reserved', 'maintenance'])],
            'notes' => 'nullable|string',
        ], [
            'section.required' => 'Section is required.',
            'row_number.required' => 'Row number is required.',
            'column_number.required' => 'Column number is required.',
            'status.required' => 'Status is required.',
            'latitude.between' => 'Latitude must be inside Himlayang Pilipino Memorial Park area.',
            'longitude.between' => 'Longitude must be inside Himlayang Pilipino Memorial Park area.',
        ]);

        // Always generate plot number server-side to enforce sequential numbering.
        $validated['plot_number'] = Plot::generateNextPlotNumber();

        // Ensure row+column combination is unique within the section
        $exists = Plot::where('section', $validated['section'])
            ->where('row_number', $validated['row_number'])
            ->where('column_number', $validated['column_number'])
            ->exists();
        if ($exists) {
            return $this->errorResponse(
                "Row {$validated['row_number']}, Column {$validated['column_number']} already exists in section '{$validated['section']}'.",
                422
            );
        }

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
            'section' => 'nullable|string|max:50',
            'row_number' => 'nullable|integer',
            'column_number' => 'nullable|integer',
            'latitude' => 'sometimes|numeric|between:' . self::HIMS_LAT_MIN . ',' . self::HIMS_LAT_MAX,
            'longitude' => 'sometimes|numeric|between:' . self::HIMS_LNG_MIN . ',' . self::HIMS_LNG_MAX,
            'status' => ['nullable', Rule::in(['available', 'occupied', 'reserved', 'maintenance'])],
            'notes' => 'nullable|string',
        ], [
            'latitude.between' => 'Latitude must be inside Himlayang Pilipino Memorial Park area.',
            'longitude.between' => 'Longitude must be inside Himlayang Pilipino Memorial Park area.',
        ]);

        // Ensure row+column combination is unique within the section (excluding current plot)
        $section = $validated['section'] ?? $plot->section;
        $rowNumber = $validated['row_number'] ?? $plot->row_number;
        $columnNumber = $validated['column_number'] ?? $plot->column_number;
        $duplicate = Plot::where('section', $section)
            ->where('row_number', $rowNumber)
            ->where('column_number', $columnNumber)
            ->where('id', '!=', $id)
            ->exists();
        if ($duplicate) {
            return $this->errorResponse(
                "Row {$rowNumber}, Column {$columnNumber} already exists in section '{$section}'.",
                422
            );
        }

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
            return $this->errorResponse('Cannot archive plot with burial record. Remove burial record first.', 400);
        }

        try {
            $plotNumber = $plot->plot_number;
            $plot->delete();

            return $this->successResponse(null, "Plot {$plotNumber} archived successfully");
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to archive plot: ' . $e->getMessage(), 500);
        }
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
     * Get the next plot number that will be assigned on create.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function nextPlotNumber()
    {
        return $this->successResponse([
            'plot_number' => Plot::generateNextPlotNumber(),
        ], 'Next plot number retrieved successfully');
    }

    /**
     * Get plots belonging to current user (member)
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function myPlots()
    {
        $user = auth()->user();
        
        // Get plots that have burial records associated with this user's email
        $plots = Plot::whereHas('burialRecord', function ($query) use ($user) {
            $query->where('contact_email', $user->email);
        })
        ->with('burialRecord')
        ->orderBy('section')
        ->get();

        return $this->successResponse($plots, 'My plots retrieved successfully');
    }
}
