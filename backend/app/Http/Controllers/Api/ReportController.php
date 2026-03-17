<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * Get payment data for report generation.
     */
    public function payments(Request $request)
    {
        $query = Payment::with(['user:id,name,email', 'plot:id,plot_number,section']);

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $query->orderBy('created_at', 'desc');

        $payments = $query->get();

        return response()->json([
            'success' => true,
            'data' => $payments,
            'summary' => [
                'total_count' => $payments->count(),
                'total_amount' => $payments->sum('amount'),
                'pending_count' => $payments->where('status', 'pending')->count(),
                'pending_amount' => $payments->where('status', 'pending')->sum('amount'),
                'verified_count' => $payments->where('status', 'verified')->count(),
                'verified_amount' => $payments->where('status', 'verified')->sum('amount'),
                'rejected_count' => $payments->where('status', 'rejected')->count(),
                'rejected_amount' => $payments->where('status', 'rejected')->sum('amount'),
            ],
        ]);
    }

    /**
     * Get feedback data for report generation.
     */
    public function feedbacks(Request $request)
    {
        $query = Feedback::with(['user:id,name,email']);

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $query->orderBy('created_at', 'desc');

        $feedbacks = $query->get();

        return response()->json([
            'success' => true,
            'data' => $feedbacks,
            'summary' => [
                'total_count' => $feedbacks->count(),
                'new_count' => $feedbacks->where('status', 'new')->count(),
                'read_count' => $feedbacks->where('status', 'read')->count(),
                'responded_count' => $feedbacks->where('status', 'responded')->count(),
                'average_rating' => round($feedbacks->whereNotNull('rating')->avg('rating'), 1) ?: 0,
            ],
        ]);
    }

    /**
     * Get list of users for the report filter dropdown.
     */
    public function users()
    {
        $users = User::select('id', 'name', 'email', 'role')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }
}
