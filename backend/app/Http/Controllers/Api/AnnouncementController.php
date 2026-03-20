<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Google\Client;

class AnnouncementController extends Controller
{
    /**
     * Display a listing of announcements
     */
    public function index(Request $request)
    {
        $query = Announcement::with('author:id,name');

        // For public/member view, only show active
        if (!$request->has('all')) {
            $query->active();
        }

        // Type filter
        if ($request->has('type') && $request->type) {
            $query->where('type', $request->type);
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%");
            });
        }

        $query->orderBy('created_at', 'desc');

        $perPage = $request->get('per_page', 10);
        $announcements = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $announcements->items(),
            'meta' => [
                'current_page' => $announcements->currentPage(),
                'last_page' => $announcements->lastPage(),
                'per_page' => $announcements->perPage(),
                'total' => $announcements->total(),
            ]
        ]);
    }

    /**
     * Store a newly created announcement
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'type' => 'required|in:info,warning,success,urgent',
            'is_active' => 'boolean',
            'published_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after:published_at',
        ]);

        $announcement = Announcement::create([
            ...$validated,
            'created_by' => auth()->id(),
            'published_at' => $validated['published_at'] ?? now(),
            'expires_at' => !empty($validated['expires_at']) ? Carbon::parse($validated['expires_at'])->endOfDay() : null,
        ]);

        // Send notifications to BOTH Expo and Firebase recipients
        $this->sendNotifications($announcement);

        return response()->json([
            'success' => true,
            'message' => 'Announcement created successfully',
            'data' => $announcement->load('author:id,name')
        ], 201);
    }

    /**
     * Send notifications to both Expo and Firebase
     */
    protected function sendNotifications($announcement)
    {
        try {
            // Get Expo tokens
            $expoTokens = User::whereNotNull('expo_push_token')
                ->pluck('expo_push_token')
                ->filter()
                ->unique()
                ->values()
                ->toArray();

            // Get FCM tokens
            $fcmTokens = User::whereNotNull('fcm_token')
                ->pluck('fcm_token')
                ->filter()
                ->unique()
                ->values()
                ->toArray();

            // Send to Expo
            if (!empty($expoTokens)) {
                $this->sendToExpo($expoTokens, $announcement);
            }

            // Send to Firebase
            if (!empty($fcmTokens)) {
                $this->sendToFirebase($fcmTokens, $announcement);
            }

            Log::info("Notifications sent for announcement {$announcement->id}", [
                'expo_count' => count($expoTokens),
                'fcm_count' => count($fcmTokens),
            ]);

        } catch (\Throwable $e) {
            Log::warning('Notification service error', [
                'announcement_id' => $announcement->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Send notification to Expo Push Service
     */
    protected function sendToExpo($tokens, $announcement)
    {
        foreach ($tokens as $token) {
            try {
                Http::timeout(8)->post('https://exp.host/--/api/v2/push/send', [
                    'to' => $token,
                    'title' => 'New Announcement',
                    'body' => $announcement->title,
                    'sound' => 'default',
                    'data' => [
                        'announcement_id' => $announcement->id,
                    ],
                ]);
            } catch (\Throwable $e) {
                Log::warning('Expo push failed', ['error' => $e->getMessage()]);
            }
        }
    }

    /**
     * Send notification to Firebase Cloud Messaging
     */
    protected function sendToFirebase($tokens, $announcement)
    {
        try {
            $projectId = config('firebase.project_id');
            $keyFile = storage_path('app/firebase-credentials.json');

            if (!file_exists($keyFile)) {
                Log::warning('Firebase credentials file not found');
                return;
            }

            $credentials = json_decode(file_get_contents($keyFile), true);
            $accessToken = $this->getFirebaseAccessToken($credentials);

            foreach ($tokens as $token) {
                try {
                    $message = [
                        'token' => $token,
                        'notification' => [
                            'title' => 'New Announcement',
                            'body' => $announcement->title,
                        ],
                        'data' => [
                            'announcement_id' => (string)$announcement->id,
                            'type' => $announcement->type,
                        ],
                        'android' => [
                            'notification' => [
                                'sound' => 'default',
                                'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                            ]
                        ],
                    ];

                    Http::timeout(8)
                        ->withToken($accessToken)
                        ->post(
                            "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send",
                            ['message' => $message]
                        );

                } catch (\Throwable $e) {
                    Log::warning('Firebase send failed for token', ['error' => $e->getMessage()]);
                }
            }

        } catch (\Throwable $e) {
            Log::warning('Firebase service error', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get Firebase Access Token
     */
    protected function getFirebaseAccessToken($credentials)
    {
        $client = new Client();
        $client->setAuthConfig($credentials);
        $client->addScope('https://www.googleapis.com/auth/firebase.messaging');
        
        $accessToken = $client->fetchAccessTokenWithAssertion();
        return $accessToken['access_token'];
    }

    /**
     * Store a newly created announcement
     */
    public function _storeOld(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'type' => 'required|in:info,warning,success,urgent',
            'is_active' => 'boolean',
            'published_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after:published_at',
        ]);

        $announcement = Announcement::create([
            ...$validated,
            'created_by' => auth()->id(),
            'published_at' => $validated['published_at'] ?? now(),
            'expires_at' => !empty($validated['expires_at']) ? Carbon::parse($validated['expires_at'])->endOfDay() : null,
        ]);

        // Non-blocking push notifications to Expo recipients.
        try {
            $tokens = User::whereNotNull('expo_push_token')
                ->pluck('expo_push_token')
                ->filter()
                ->unique()
                ->values();

            foreach ($tokens as $token) {
                Http::timeout(8)->post('https://exp.host/--/api/v2/push/send', [
                    'to' => $token,
                    'title' => 'New Announcement',
                    'body' => $announcement->title,
                    'sound' => 'default',
                    'data' => [
                        'announcement_id' => $announcement->id,
                    ],
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('Expo push notification failed', [
                'announcement_id' => $announcement->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Display the specified announcement
     */
    public function show($id)
    {
        $announcement = Announcement::with('author:id,name')->find($id);

        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Announcement not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $announcement
        ]);
    }

    /**
     * Update the specified announcement
     */
    public function update(Request $request, $id)
    {
        $announcement = Announcement::find($id);

        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Announcement not found'
            ], 404);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'content' => 'sometimes|required|string',
            'type' => 'sometimes|required|in:info,warning,success,urgent',
            'is_active' => 'sometimes|boolean',
            'published_at' => 'nullable|date',
            'expires_at' => 'nullable|date',
        ]);

        if (array_key_exists('expires_at', $validated)) {
            $validated['expires_at'] = !empty($validated['expires_at'])
                ? Carbon::parse($validated['expires_at'])->endOfDay()
                : null;
        }

        $announcement->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Announcement updated successfully',
            'data' => $announcement->load('author:id,name')
        ]);
    }

    /**
     * Remove the specified announcement
     */
    public function destroy($id)
    {
        $announcement = Announcement::find($id);

        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Announcement not found'
            ], 404);
        }

        $announcement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Announcement archived successfully'
        ]);
    }

    /**
     * Get announcement statistics
     */
    public function statistics()
    {
        $stats = [
            'total' => Announcement::count(),
            'active' => Announcement::active()->count(),
            'info' => Announcement::where('type', 'info')->count(),
            'warning' => Announcement::where('type', 'warning')->count(),
            'urgent' => Announcement::where('type', 'urgent')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}
