<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ValidationRules;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Display a listing of all users including pending invited users
     */
    public function index(Request $request)
    {
        $query = User::query();

        // By default show only active (non-archived) users.
        // Pass ?archived=1 to list archived users instead.
        if ($request->boolean('archived')) {
            $query->where('is_archived', true);
        } else {
            $query->where('is_archived', false);
        }

        // Search filter
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Role filter
        if ($request->has('role') && $request->role) {
            $query->where('role', $request->role);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 10);
        $users = $query->paginate($perPage);

        // Add status indicator for pending invited users
        $users->getCollection()->transform(function ($user) {
            $user->is_pending_invitation = !$user->invitation_accepted && $user->invitation_token;
            $user->status = $user->is_pending_invitation ? 'pending' : ($user->is_archived ? 'archived' : 'active');
            return $user;
        });

        return response()->json([
            'success' => true,
            'data' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ]
        ]);
    }

    /**
     * Store a newly created user
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'string', ValidationRules::strongPasswordRule()],
            'role' => 'required|in:admin,staff,member',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'data' => $user
        ], 201);
    }

    /**
     * Display the specified user
     */
    public function show($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    /**
     * Update the specified user — DISABLED for admin panel use.
     * User records are view-only; only the user themselves may update
     * their own profile via /profile endpoints.
     */
    public function update(Request $request, $id)
    {
        return response()->json([
            'success' => false,
            'message' => 'Editing user records is not permitted. Use the archive function to deactivate a user.',
        ], 403);
    }

    /**
     * Hard-delete a user — DISABLED for safety.
     * Use the archive endpoint instead to deactivate without data loss.
     */
    public function destroy($id)
    {
        return response()->json([
            'success' => false,
            'message' => 'Permanent deletion is not permitted. Use the archive function to deactivate a user.',
        ], 403);
    }

    /**
     * Archive a user (soft-deactivate).
     * - Sets is_archived = true and records archived_at timestamp.
     * - Admin cannot archive themselves or another admin.
     */
    public function archive($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User not found'], 404);
        }

        if ($user->id === auth()->id()) {
            return response()->json(['success' => false, 'message' => 'You cannot archive your own account.'], 403);
        }

        if ($user->role === 'admin') {
            return response()->json(['success' => false, 'message' => 'Admin accounts cannot be archived.'], 403);
        }

        if ($user->is_archived) {
            return response()->json(['success' => false, 'message' => 'User is already archived.'], 422);
        }

        // Revoke all active tokens so the user is immediately signed out.
        $user->tokens()->delete();

        $user->update([
            'is_archived' => true,
            'archived_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User archived successfully. They can no longer log in.',
            'data' => $user,
        ]);
    }

    /**
     * Unarchive (restore) a previously archived user.
     */
    public function unarchive($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User not found'], 404);
        }

        if (!$user->is_archived) {
            return response()->json(['success' => false, 'message' => 'User is not archived.'], 422);
        }

        $user->update([
            'is_archived' => false,
            'archived_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User restored successfully.',
            'data' => $user,
        ]);
    }

    /**
     * Get user by email (only returns activated accounts)
     */
    public function getByEmail(Request $request)
    {
        $email = $request->query('email');
        
        if (!$email) {
            return response()->json([
                'success' => false,
                'message' => 'Email is required'
            ], 400);
        }

        $user = User::where('email', $email)
                    ->where('invitation_accepted', true)
                    ->first();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found or account not activated'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ]
        ]);
    }

    /**
     * Get user statistics
     */
    public function statistics()
    {
        // Exclude pending invited users (invitation_accepted = false AND invitation_token IS NOT NULL)
        $activatedUsers = User::where('is_archived', false)->where('invitation_accepted', true);
        $activatedUsersArchived = User::where('is_archived', false)->where('invitation_accepted', true);

        $stats = [
            'total'    => $activatedUsers->count(),
            'admins'   => $activatedUsersArchived->where('role', 'admin')->count(),
            'staff'    => $activatedUsersArchived->where('role', 'staff')->count(),
            'members'  => $activatedUsersArchived->where('role', 'member')->count(),
            'recent'   => $activatedUsersArchived->where('created_at', '>=', now()->subDays(30))->count(),
            'archived' => User::where('is_archived', true)->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Save Expo push token and Firebase token for authenticated user
     */
    public function saveToken(Request $request)
    {
        $validated = $request->validate([
            'expo_push_token' => 'nullable|string|max:255',
            'fcm_token' => 'nullable|string|max:255',
        ]);

        $user = auth()->user();
        
        if ($validated['expo_push_token'] ?? null) {
            $user->expo_push_token = $validated['expo_push_token'];
        }
        
        if ($validated['fcm_token'] ?? null) {
            $user->fcm_token = $validated['fcm_token'];
        }
        
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Push tokens saved successfully',
        ]);
    }

    /**
     * Update the authenticated user's profile
     */
    public function updateProfile(Request $request)
    {
        $user = auth()->user();

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => [
                'sometimes',
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
            'phone' => 'sometimes|nullable|string|max:20',
            'address' => 'sometimes|nullable|string|max:500',
            'avatar' => 'sometimes|nullable|image|mimes:png,jpg,jpeg|max:5120', // 5MB max
        ]);

        if (isset($validated['name'])) {
            $user->name = $validated['name'];
        }
        if (isset($validated['email'])) {
            $user->email = $validated['email'];
        }
        if (isset($validated['phone'])) {
            $user->phone = $validated['phone'];
        }
        if (isset($validated['address'])) {
            $user->address = $validated['address'];
        }

        // Handle avatar upload
        if ($request->hasFile('avatar')) {
            $file = $request->file('avatar');
            $filename = 'avatar_' . $user->id . '_' . time() . '.' . $file->extension();
            
            // Ensure avatars directory exists
            \Illuminate\Support\Facades\Storage::disk('public')->makeDirectory('avatars', 0755, true);
            
            // Store in public/avatars directory
            $path = $file->storeAs('avatars', $filename, 'public');
            
            // Delete old avatar if it exists
            if ($user->avatar && \Illuminate\Support\Facades\Storage::disk('public')->exists($user->avatar)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($user->avatar);
            }
            
            $user->avatar = $path;
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => $user
        ]);
    }
}
