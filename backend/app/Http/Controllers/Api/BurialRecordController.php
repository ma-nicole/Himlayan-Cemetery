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

        // Search by deceased name, nickname, dates, plot number, section
        if ($request->has('search')) {
            $searchTerm = $request->search;
            $query->where(function($q) use ($searchTerm) {
                $q->where('deceased_name', 'like', '%' . $searchTerm . '%')
                  ->orWhere('deceased_nickname', 'like', '%' . $searchTerm . '%')
                  ->orWhere('birth_date', 'like', '%' . $searchTerm . '%')
                  ->orWhere('death_date', 'like', '%' . $searchTerm . '%')
                  ->orWhere('burial_date', 'like', '%' . $searchTerm . '%')
                  // Support extended date formats
                  ->orWhereRaw("DATE_FORMAT(birth_date, '%M %d, %Y') LIKE ?", ["%{$searchTerm}%"])
                  ->orWhereRaw("DATE_FORMAT(death_date, '%M %d, %Y') LIKE ?", ["%{$searchTerm}%"])
                  ->orWhereRaw("DATE_FORMAT(burial_date, '%M %d, %Y') LIKE ?", ["%{$searchTerm}%"])
                  // Handle no-comma year inputs like "February 2 2026"
                  ->orWhereRaw("DATE_FORMAT(birth_date, '%M %e %Y') LIKE ?", ["%{$searchTerm}%"])
                  ->orWhereRaw("DATE_FORMAT(death_date, '%M %e %Y') LIKE ?", ["%{$searchTerm}%"])
                  ->orWhereRaw("DATE_FORMAT(burial_date, '%M %e %Y') LIKE ?", ["%{$searchTerm}%"])
                  ->orWhereRaw("DATE_FORMAT(birth_date, '%M %d %Y') LIKE ?", ["%{$searchTerm}%"])
                  ->orWhereRaw("DATE_FORMAT(death_date, '%M %d %Y') LIKE ?", ["%{$searchTerm}%"])
                  ->orWhereRaw("DATE_FORMAT(burial_date, '%M %d %Y') LIKE ?", ["%{$searchTerm}%"])
                  ->orWhereRaw("DATE_FORMAT(birth_date, '%M %d') LIKE ?", ["%{$searchTerm}%"])
                  ->orWhereRaw("DATE_FORMAT(death_date, '%M %d') LIKE ?", ["%{$searchTerm}%"])
                  ->orWhereRaw("DATE_FORMAT(burial_date, '%M %d') LIKE ?", ["%{$searchTerm}%"])
                  // Handle single-digit days without double spaces (e.g., "February 2")
                  ->orWhereRaw("CONCAT(DATE_FORMAT(birth_date, '%M'), ' ', DAY(birth_date)) LIKE ?", ["%{$searchTerm}%"])
                  ->orWhereRaw("CONCAT(DATE_FORMAT(death_date, '%M'), ' ', DAY(death_date)) LIKE ?", ["%{$searchTerm}%"])
                  ->orWhereRaw("CONCAT(DATE_FORMAT(burial_date, '%M'), ' ', DAY(burial_date)) LIKE ?", ["%{$searchTerm}%"])
                  ->orWhereRaw("DATE_FORMAT(birth_date, '%m-%d-%Y') LIKE ?", ["%{$searchTerm}%"])
                  ->orWhereRaw("DATE_FORMAT(death_date, '%m-%d-%Y') LIKE ?", ["%{$searchTerm}%"])
                  ->orWhereRaw("DATE_FORMAT(burial_date, '%m-%d-%Y') LIKE ?", ["%{$searchTerm}%"])
                  ->orWhereHas('plot', function($q) use ($searchTerm) {
                      $q->where('plot_number', 'like', '%' . $searchTerm . '%')
                        ->orWhere('section', 'like', '%' . $searchTerm . '%');
                  });
            });
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

        // Transform records to include full photo URLs
        $records->getCollection()->transform(function ($record) {
            $record->deceased_photo_url = $record->deceased_photo_url ? asset('storage/' . $record->deceased_photo_url) : null;
            return $record;
        });

        return $this->successResponse($records, 'Burial records retrieved successfully');
    }

    /**
     * Get burial records associated with the authenticated user
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function myRecords(Request $request)
    {
        $user = auth()->user();
        
        $records = BurialRecord::with(['plot', 'qrCode'])
            ->where('contact_email', $user->email)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($record) {
                $record->deceased_photo_url = $record->deceased_photo_url ? asset('storage/' . $record->deceased_photo_url) : null;
                return $record;
            });

        return $this->successResponse($records, 'My burial records retrieved successfully');
    }

    /**
     * Update a burial record by a family member (restricted fields)
     * 
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateMyRecord(Request $request, $id)
    {
        $user = auth()->user();
        $record = BurialRecord::find($id);

        if (!$record) {
            return $this->errorResponse('Burial record not found', 404);
        }

        // Verify ownership/permission
        if ($record->contact_email !== $user->email) {
            return $this->errorResponse('You do not have permission to edit this record', 403);
        }

        $validated = $request->validate([
            'deceased_nickname' => 'nullable|string|max:255',
            'is_publicly_searchable' => 'required|boolean', // strictly boolean 0 or 1, or true/false
            'obituary' => 'nullable|string',
            'deceased_photo' => 'nullable|image|mimes:jpeg,jpg,png|max:5120',
        ]);

        $updateData = [
            'deceased_nickname' => $validated['deceased_nickname'],
            'is_publicly_searchable' => filter_var($validated['is_publicly_searchable'], FILTER_VALIDATE_BOOLEAN),
            'obituary' => $validated['obituary'],
        ];

        // Handle photo upload if present
        if ($request->hasFile('deceased_photo')) {
            // Delete old photo if exists
            if ($record->deceased_photo_url) {
                \Storage::disk('public')->delete($record->deceased_photo_url);
            }
            
            $photo = $request->file('deceased_photo');
            $photoPath = $photo->store('deceased_photos', 'public');
            $updateData['deceased_photo_url'] = $photoPath;
        }

        $record->update($updateData);
        $record->load(['plot', 'qrCode']);
        
        // Transform photo URL for response
        $record->deceased_photo_url = $record->deceased_photo_url ? asset('storage/' . $record->deceased_photo_url) : null;

        return $this->successResponse($record, 'Record updated successfully');
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
            'deceased_first_name' => 'nullable|string|max:255',
            'deceased_middle_initial' => 'nullable|string|max:2',
            'deceased_last_name' => 'nullable|string|max:255',
            'deceased_nickname' => 'nullable|string|max:255',
            'deceased_photo' => 'nullable|image|mimes:jpeg,jpg,png|max:5120', // 5MB max
            'deceased_gender' => 'nullable|string|in:Male,Female',
            'is_publicly_searchable' => 'nullable|boolean',
            'birth_date' => 'nullable|date|before:death_date',
            'death_date' => 'required|date',
            'burial_date' => 'required|date|after_or_equal:death_date',
            'photo_url' => 'nullable|string|url',
            'obituary' => 'nullable|string',
            'notes' => 'nullable|string',
            'contact_name' => 'nullable|string|max:255',
            'contact_first_name' => 'nullable|string|max:255',
            'contact_middle_initial' => 'nullable|string|max:2',
            'contact_last_name' => 'nullable|string|max:255',
            'contact_country_code' => 'nullable|string|max:10',
            'contact_phone' => 'nullable|string|max:50',
            'contact_email' => 'nullable|email',
            'contact2_first_name' => 'nullable|string|max:255',
            'contact2_middle_initial' => 'nullable|string|max:2',
            'contact2_last_name' => 'nullable|string|max:255',
            'contact2_country_code' => 'nullable|string|max:10',
            'contact2_phone' => 'nullable|string|max:50',
            'contact2_email' => 'nullable|email',
        ]);

        // Check if plot is available
        $plot = Plot::find($validated['plot_id']);
        if ($plot->status === 'occupied') {
            return $this->errorResponse('Plot is already occupied', 400);
        }

        // Handle photo upload if present
        if ($request->hasFile('deceased_photo')) {
            $photo = $request->file('deceased_photo');
            $photoPath = $photo->store('deceased_photos', 'public');
            $validated['deceased_photo_url'] = $photoPath;
        }

        // Remove the file from validated data (we already saved the path)
        unset($validated['deceased_photo']);

        // Create burial record
        $burialRecord = BurialRecord::create($validated);

        // Update plot status to occupied
        $plot->update(['status' => 'occupied']);

        // Load relationships
        $burialRecord->load(['plot', 'qrCode']);
        
        // Transform photo URL for response
        $burialRecord->deceased_photo_url = $burialRecord->deceased_photo_url ? asset('storage/' . $burialRecord->deceased_photo_url) : null;

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
        
        // Transform photo URL for response
        $record->deceased_photo_url = $record->deceased_photo_url ? asset('storage/' . $record->deceased_photo_url) : null;

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
            'deceased_first_name' => 'nullable|string|max:255',
            'deceased_middle_initial' => 'nullable|string|max:2',
            'deceased_last_name' => 'nullable|string|max:255',
            'deceased_nickname' => 'nullable|string|max:255',
            'deceased_photo' => 'nullable|image|mimes:jpeg,jpg,png|max:5120',
            'deceased_gender' => 'nullable|string|in:Male,Female',
            'is_publicly_searchable' => 'nullable|boolean',
            'birth_date' => 'nullable|date',
            'death_date' => 'sometimes|date',
            'burial_date' => 'sometimes|date',
            'photo_url' => 'nullable|string|url',
            'obituary' => 'nullable|string',
            'notes' => 'nullable|string',
            'contact_name' => 'nullable|string|max:255',
            'contact_first_name' => 'nullable|string|max:255',
            'contact_middle_initial' => 'nullable|string|max:2',
            'contact_last_name' => 'nullable|string|max:255',
            'contact_country_code' => 'nullable|string|max:10',
            'contact_phone' => 'nullable|string|max:50',
            'contact_email' => 'nullable|email',
            'contact2_first_name' => 'nullable|string|max:255',
            'contact2_middle_initial' => 'nullable|string|max:2',
            'contact2_last_name' => 'nullable|string|max:255',
            'contact2_country_code' => 'nullable|string|max:10',
            'contact2_phone' => 'nullable|string|max:50',
            'contact2_email' => 'nullable|email',
        ]);

        // Handle photo upload if present
        if ($request->hasFile('deceased_photo')) {
            // Delete old photo if exists
            if ($record->deceased_photo_url) {
                \Storage::disk('public')->delete($record->deceased_photo_url);
            }
            
            $photo = $request->file('deceased_photo');
            $photoPath = $photo->store('deceased_photos', 'public');
            $validated['deceased_photo_url'] = $photoPath;
        }

        // Remove the file from validated data
        unset($validated['deceased_photo']);

        $record->update($validated);
        
        // Sync contact info with User if associated account exists
        if ($record->contact_email) {
            $user = \App\Models\User::where('email', $record->contact_email)->first();
            if ($user) {
                // Construct full name from detailed fields
                $parts = [];
                if ($record->contact_first_name) $parts[] = $record->contact_first_name;
                if ($record->contact_middle_initial) $parts[] = $record->contact_middle_initial; // No dot? assuming dot isn't stored or added here
                if ($record->contact_last_name) $parts[] = $record->contact_last_name;
                
                $fullName = implode(' ', $parts);
                
                // Fallback to contact_name if detailed fields were not populated properly
                if (empty(trim($fullName))) {
                    $fullName = $record->contact_name;
                }
                
                if (!empty(trim($fullName)) && $user->name !== $fullName) {
                    $user->name = $fullName;
                    $user->save();
                }
            }
        }

        $record->load(['plot', 'qrCode']);
        
        // Transform photo URL for response
        $record->deceased_photo_url = $record->deceased_photo_url ? asset('storage/' . $record->deceased_photo_url) : null;

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
