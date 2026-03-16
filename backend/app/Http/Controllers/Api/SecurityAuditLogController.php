<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SecurityAuditLog;
use Illuminate\Http\Request;

class SecurityAuditLogController extends Controller
{
    /**
     * List security audit events with optional filters.
     */
    public function index(Request $request)
    {
        $perPage = max(1, min((int) $request->query('per_page', 25), 100));

        $query = SecurityAuditLog::query()->with('user:id,name,email,role');

        if ($request->filled('event')) {
            $query->where('event', $request->query('event'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->query('user_id'));
        }

        if ($request->filled('from')) {
            $query->where('created_at', '>=', $request->query('from'));
        }

        if ($request->filled('to')) {
            $query->where('created_at', '<=', $request->query('to'));
        }

        $logs = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Security audit logs retrieved successfully.',
            'data' => $logs,
        ]);
    }
}
