<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    /**
     * Display a listing of feedbacks (admin only)
     */
    public function index(Request $request)
    {
        $query = Feedback::with(['user:id,name,email', 'responder:id,name']);

        // Status filter
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Rating filter
        if ($request->has('rating') && $request->rating) {
            $query->where('rating', $request->rating);
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('subject', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%");
            });
        }

        $query->orderBy('created_at', 'desc');

        $perPage = $request->get('per_page', 10);
        $feedbacks = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $feedbacks->items(),
            'meta' => [
                'current_page' => $feedbacks->currentPage(),
                'last_page' => $feedbacks->lastPage(),
                'per_page' => $feedbacks->perPage(),
                'total' => $feedbacks->total(),
            ]
        ]);
    }

    /**
     * Store a newly created feedback (public or member)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'subject' => 'nullable|string|max:255',
            'message' => 'required|string',
            'rating' => 'nullable|integer|min:1|max:5',
        ]);

        $feedback = Feedback::create([
            ...$validated,
            'user_id' => auth()->id() ?? null,
            'status' => 'new',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Thank you for your feedback!',
            'data' => $feedback
        ], 201);
    }

    /**
     * Display the specified feedback
     */
    public function show($id)
    {
        $feedback = Feedback::with(['user:id,name,email', 'responder:id,name'])->find($id);

        if (!$feedback) {
            return response()->json([
                'success' => false,
                'message' => 'Feedback not found'
            ], 404);
        }

        // Mark as read if it's new
        if ($feedback->status === 'new') {
            $feedback->update(['status' => 'read']);
        }

        return response()->json([
            'success' => true,
            'data' => $feedback
        ]);
    }

    /**
     * Respond to feedback (admin only)
     */
    public function respond(Request $request, $id)
    {
        $feedback = Feedback::find($id);

        if (!$feedback) {
            return response()->json([
                'success' => false,
                'message' => 'Feedback not found'
            ], 404);
        }

        $validated = $request->validate([
            'admin_response' => 'required|string',
        ]);

        $feedback->update([
            'admin_response' => $validated['admin_response'],
            'status' => 'responded',
            'responded_by' => auth()->id(),
            'responded_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Response sent successfully',
            'data' => $feedback->load('responder:id,name')
        ]);
    }

    /**
     * Delete feedback
     */
    public function destroy($id)
    {
        $feedback = Feedback::find($id);

        if (!$feedback) {
            return response()->json([
                'success' => false,
                'message' => 'Feedback not found'
            ], 404);
        }

        $feedback->delete();

        return response()->json([
            'success' => true,
            'message' => 'Feedback deleted successfully'
        ]);
    }

    /**
     * Get feedback statistics
     */
    public function statistics()
    {
        $stats = [
            'total' => Feedback::count(),
            'new' => Feedback::where('status', 'new')->count(),
            'read' => Feedback::where('status', 'read')->count(),
            'responded' => Feedback::where('status', 'responded')->count(),
            'average_rating' => round(Feedback::whereNotNull('rating')->avg('rating'), 1) ?: 0,
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}
