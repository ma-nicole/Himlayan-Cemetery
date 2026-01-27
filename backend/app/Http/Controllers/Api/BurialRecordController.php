<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BurialRecord;
use App\Models\Plot;
use Illuminate\Http\Request;

class BurialRecordController extends Controller
{
    /**
     * Display a listing of burial records
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $query = BurialRecord::with(['plot', 'qrCode']);

        // Search by deceased name
        if ($request->has('search')) {
            $query->where('deceased_name', 'like', '%' . $request->search . '%');
        }

        // Filter by date range
        if ($request->has('date_from')) {
            $query->where('burial_date', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->where('burial_date', '<=', $request->date_to);
        }

        $records = $query->orderBy('burial_date', 'desc')
                         ->paginate($request->per_page ?? 15);

        return $this->successResponse($records, 'Burial records retrieved successfully');
    }

    /**
     * Store a newly created burial record
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'plot_id' => 'required|exists:plots,id',
            'deceased_name' => 'required|string|max:255',
            'birth_date' => 'nullable|date|before:death_date',
            'death_date' => 'required|date',
            'burial_date' => 'required|date|after_or_equal:death_date',
            'photo_url' => 'nullable|string|url',
            'obituary' => 'nullable|string',
            'notes' => 'nullable|string',
            'contact_name' => 'nullable|string|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'contact_email' => 'nullable|email',
        ]);

        // Check if plot is available
        $plot = Plot::find($validated['plot_id']);
        if ($plot->status === 'occupied') {
            return $this->errorResponse('Plot is already occupied', 400);
        }

        // Create burial record
        $burialRecord = BurialRecord::create($validated);

        // Update plot status to occupied
        $plot->update(['status' => 'occupied']);

        // Load relationships
        $burialRecord->load(['plot', 'qrCode']);

        return $this->successResponse($burialRecord, 'Burial record created successfully', 201);
    }

    /**
     * Display the specified burial record
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        $record = BurialRecord::with(['plot', 'qrCode'])->find($id);

        if (!$record) {
            return $this->errorResponse('Burial record not found', 404);
        }

        // Add computed attribute
        $record->age_at_death = $record->age_at_death;

        return $this->successResponse($record, 'Burial record retrieved successfully');
    }

    /**
     * Update the specified burial record
     * 
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        $record = BurialRecord::find($id);

        if (!$record) {
            return $this->errorResponse('Burial record not found', 404);
        }

        $validated = $request->validate([
            'deceased_name' => 'sometimes|string|max:255',
            'birth_date' => 'nullable|date',
            'death_date' => 'sometimes|date',
            'burial_date' => 'sometimes|date',
            'photo_url' => 'nullable|string|url',
            'obituary' => 'nullable|string',
            'notes' => 'nullable|string',
            'contact_name' => 'nullable|string|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'contact_email' => 'nullable|email',
        ]);

        $record->update($validated);
        $record->load(['plot', 'qrCode']);

        return $this->successResponse($record, 'Burial record updated successfully');
    }

    /**
     * Remove the specified burial record
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        $record = BurialRecord::find($id);

        if (!$record) {
            return $this->errorResponse('Burial record not found', 404);
        }

        // Update plot status back to available
        $record->plot->update(['status' => 'available']);

        // Delete QR code if exists
        if ($record->qrCode) {
            $record->qrCode->delete();
        }

        $record->delete();

        return $this->successResponse(null, 'Burial record deleted successfully');
    }

    /**
     * Search burial records
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function search(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:2',
        ]);

        $query = $request->query('query');

        $records = BurialRecord::with(['plot'])
            ->where('deceased_name', 'like', '%' . $query . '%')
            ->orWhereHas('plot', function ($q) use ($query) {
                $q->where('plot_number', 'like', '%' . $query . '%')
                  ->orWhere('section', 'like', '%' . $query . '%');
            })
            ->limit(20)
            ->get();

        return $this->successResponse($records, 'Search results retrieved');
    }

    /**
     * Get burial record statistics
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function statistics()
    {
        $stats = [
            'total_records' => BurialRecord::count(),
            'this_month' => BurialRecord::whereMonth('burial_date', now()->month)
                                        ->whereYear('burial_date', now()->year)
                                        ->count(),
            'this_year' => BurialRecord::whereYear('burial_date', now()->year)->count(),
        ];

        return $this->successResponse($stats, 'Statistics retrieved successfully');
    }
}
