<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ServiceRequest;
use Illuminate\Http\Request;

class ServiceRequestController extends Controller
{
    /**
     * Display a listing of service requests
     */
    public function index(Request $request)
    {
        $query = ServiceRequest::with(['user:id,name,email', 'processor:id,name']);

        // For members, only show their own requests
        if (auth()->user()->role === 'member') {
            $query->where('user_id', auth()->id());
        }

        // Status filter
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Service type filter
        if ($request->has('service_type') && $request->service_type) {
            $query->where('service_type', $request->service_type);
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($q2) use ($search) {
                      $q2->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $query->orderBy('created_at', 'desc');

        $perPage = $request->get('per_page', 10);
        $requests = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $requests->items(),
            'meta' => [
                'current_page' => $requests->currentPage(),
                'last_page' => $requests->lastPage(),
                'per_page' => $requests->perPage(),
                'total' => $requests->total(),
            ]
        ]);
    }

    /**
     * Store a newly created service request (for members)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'service_type' => 'required|string|max:100',
            'description' => 'nullable|string',
            'preferred_date' => 'nullable|date|after:today',
            'contact_number' => 'nullable|string|max:20',
        ]);

        $serviceRequest = ServiceRequest::create([
            ...$validated,
            'user_id' => auth()->id(),
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Service request submitted successfully',
            'data' => $serviceRequest->load('user:id,name,email')
        ], 201);
    }

    /**
     * Display the specified service request
     */
    public function show($id)
    {
        $serviceRequest = ServiceRequest::with(['user:id,name,email', 'processor:id,name'])->find($id);

        if (!$serviceRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Service request not found'
            ], 404);
        }

        // Members can only view their own
        if (auth()->user()->role === 'member' && $serviceRequest->user_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $serviceRequest
        ]);
    }

    /**
     * Update service request status (admin/staff only)
     */
    public function update(Request $request, $id)
    {
        $serviceRequest = ServiceRequest::find($id);

        if (!$serviceRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Service request not found'
            ], 404);
        }

        $validated = $request->validate([
            'status' => 'sometimes|required|in:pending,approved,rejected,completed',
            'admin_notes' => 'nullable|string',
        ]);

        if (isset($validated['status']) && $validated['status'] !== $serviceRequest->status) {
            $serviceRequest->processed_by = auth()->id();
            $serviceRequest->processed_at = now();
        }

        $serviceRequest->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Service request updated successfully',
            'data' => $serviceRequest->load(['user:id,name,email', 'processor:id,name'])
        ]);
    }

    /**
     * Delete a service request
     */
    public function destroy($id)
    {
        $serviceRequest = ServiceRequest::find($id);

        if (!$serviceRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Service request not found'
            ], 404);
        }

        $serviceRequest->delete();

        return response()->json([
            'success' => true,
            'message' => 'Service request deleted successfully'
        ]);
    }

    /**
     * Get service request statistics
     */
    public function statistics()
    {
        $stats = [
            'total' => ServiceRequest::count(),
            'pending' => ServiceRequest::where('status', 'pending')->count(),
            'approved' => ServiceRequest::where('status', 'approved')->count(),
            'completed' => ServiceRequest::where('status', 'completed')->count(),
            'rejected' => ServiceRequest::where('status', 'rejected')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}
