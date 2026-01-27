<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    /**
     * Display a listing of payments
     */
    public function index(Request $request)
    {
        $query = Payment::with(['user:id,name,email', 'plot:id,plot_number,section', 'verifier:id,name']);

        // For members, only show their own payments
        if (auth()->user()->role === 'member') {
            $query->where('user_id', auth()->id());
        }

        // Status filter
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Payment type filter
        if ($request->has('payment_type') && $request->payment_type) {
            $query->where('payment_type', $request->payment_type);
        }

        // Search by reference number
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference_number', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($q2) use ($search) {
                      $q2->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $query->orderBy('created_at', 'desc');

        $perPage = $request->get('per_page', 10);
        $payments = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $payments->items(),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ]
        ]);
    }

    /**
     * Store a newly created payment (member submits payment)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'plot_id' => 'nullable|exists:plots,id',
            'amount' => 'required|numeric|min:1',
            'payment_type' => 'required|string|max:50',
            'payment_method' => 'required|string|max:50',
            'reference_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        $payment = Payment::create([
            ...$validated,
            'user_id' => auth()->id(),
            'status' => 'pending',
            'paid_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment submitted successfully. Awaiting verification.',
            'data' => $payment->load(['user:id,name,email', 'plot:id,plot_number,section'])
        ], 201);
    }

    /**
     * Display the specified payment
     */
    public function show($id)
    {
        $payment = Payment::with(['user:id,name,email', 'plot:id,plot_number,section', 'verifier:id,name'])->find($id);

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment not found'
            ], 404);
        }

        // Members can only view their own
        if (auth()->user()->role === 'member' && $payment->user_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $payment
        ]);
    }

    /**
     * Verify payment (admin/staff only)
     */
    public function verify(Request $request, $id)
    {
        $payment = Payment::find($id);

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment not found'
            ], 404);
        }

        $validated = $request->validate([
            'status' => 'required|in:verified,rejected',
            'notes' => 'nullable|string',
        ]);

        $payment->update([
            'status' => $validated['status'],
            'notes' => $validated['notes'] ?? $payment->notes,
            'verified_by' => auth()->id(),
            'verified_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment ' . $validated['status'] . ' successfully',
            'data' => $payment->load(['user:id,name,email', 'verifier:id,name'])
        ]);
    }

    /**
     * Delete a payment
     */
    public function destroy($id)
    {
        $payment = Payment::find($id);

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment not found'
            ], 404);
        }

        $payment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Payment deleted successfully'
        ]);
    }

    /**
     * Get payment statistics
     */
    public function statistics()
    {
        $stats = [
            'total' => Payment::count(),
            'pending' => Payment::where('status', 'pending')->count(),
            'verified' => Payment::where('status', 'verified')->count(),
            'rejected' => Payment::where('status', 'rejected')->count(),
            'total_amount' => Payment::where('status', 'verified')->sum('amount'),
            'pending_amount' => Payment::where('status', 'pending')->sum('amount'),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Get user's dues (plots they need to pay for)
     */
    public function myDues()
    {
        // This would typically be linked to plots owned by the user
        // For now, return user's pending payments
        $payments = Payment::where('user_id', auth()->id())
            ->where('status', 'pending')
            ->with('plot:id,plot_number,section')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $payments
        ]);
    }
}
