/**
 * Shared photo URL resolution utility.
 *
 * All stored photos are served through the backend Laravel API route
 * GET /api/file/{path} (StorageController::serve), which reads directly
 * from disk — no symlink, no .htaccess tricks required. This works the
 * same on desktop, mobile, and every browser.
 *
 * Handles these input shapes:
 *  - relative path  (e.g. "deceased_photos/photo.jpg")
 *  - legacy full storage URL  (e.g. "https://host/storage/deceased_photos/photo.jpg")
 *  - new API file URL  (e.g. "https://host/api/file/deceased_photos/photo.jpg")
 *  - localhost dev URL
 *
 * Also appends a cache-busting query param from `updatedAt`.
 */

const rawApiUrl = (process.env.REACT_APP_API_URL || 'https://himlayangpilipino.com/api').replace(/\/?$/, '');
export const backendBaseUrl = rawApiUrl.replace(/\/api$/, '');

/**
 * Build the /api/file/ URL for a given relative storage path.
 */
const toFileApiUrl = (relative) => `${rawApiUrl}/file/${relative.replace(/^\/+/, '')}`;

/**
 * Resolve a photo value to a fully-qualified, cache-busted /api/file/ URL.
 *
 * @param {string|null|undefined} photoValue  The raw value from the API.
 * @param {string|null|undefined} updatedAt   ISO date string used for cache-busting.
 * @returns {string|null}
 */
export const resolvePhotoUrl = (photoValue, updatedAt = null) => {
  if (!photoValue) return null;

  let resolvedUrl;

  if (/^https?:\/\//i.test(photoValue)) {
    // Full URL: could be a new /api/file/ URL, legacy /storage/ URL, or localhost.
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(photoValue)) {
      // Dev localhost URL — extract relative path and route through API.
      try {
        const url = new URL(photoValue);
        let path = url.pathname.replace(/^\/+/, '').replace(/^api\//i, '');
        // Strip 'storage/' prefix if present
        path = path.replace(/^storage\//i, '');
        resolvedUrl = toFileApiUrl(path);
      } catch {
        return null;
      }
    } else {
      // Production URL.
      // If it already uses /api/file/, keep it as-is.
      if (/\/api\/file\//i.test(photoValue)) {
        resolvedUrl = photoValue;
      } else if (/\/file\//i.test(photoValue) && !/\/storage\//i.test(photoValue)) {
        // Bare /file/ URL (missing /api prefix from a known bug) — insert /api.
        resolvedUrl = photoValue.replace(/\/file\//i, '/api/file/');
      } else {
        // Legacy /storage/ or /api/storage/ URL — rewrite to /api/file/.
        const normalized = photoValue
          .replace(/\/api\/storage\//i, '/storage/')   // fix /api/storage/ first
          .replace(/\/storage\//i, '/api/file/');       // then turn /storage/ into /api/file/
        resolvedUrl = normalized;
      }
    }
  } else {
    // Relative path — route through API.
    const relative = String(photoValue)
      .replace(/^\/+/, '')
      .replace(/^api\//i, '')
      .replace(/^storage\//i, '');
    resolvedUrl = toFileApiUrl(relative);
  }

  if (resolvedUrl && updatedAt) {
    const ts = new Date(updatedAt).getTime();
    if (!isNaN(ts)) resolvedUrl += `?v=${ts}`;
  }

  return resolvedUrl;
};

/**
 * Resolve a user avatar URL. Same logic as resolvePhotoUrl.
 * Convenience alias so pages dealing with user avatars can import by name.
 *
 * @param {string|null|undefined} avatarValue
 * @param {string|null|undefined} updatedAt
 * @returns {string|null}
 */
export const resolveAvatarUrl = (avatarValue, updatedAt = null) =>
  resolvePhotoUrl(avatarValue, updatedAt);
