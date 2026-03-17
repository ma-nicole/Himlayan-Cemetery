/**
 * Shared photo URL resolution utility.
 *
 * Normalises whatever the API returns for deceased_photo_url:
 *  - relative path  → backendBaseUrl/storage/<path>
 *  - full URL with /api/storage→ strip /api prefix
 *  - localhost URL  → rewrite host to backendBaseUrl
 * Also appends a cache-busting query param from `updatedAt` so browsers
 * always refresh after an upload without forcing a hard reload.
 */

const rawApiUrl = process.env.REACT_APP_API_URL || 'https://himlayangpilipino.com/api';
export const backendBaseUrl = rawApiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

/**
 * Resolve a photo value to a fully-qualified, cache-busted URL.
 *
 * @param {string|null|undefined} photoValue  The raw value from the API.
 * @param {string|null|undefined} updatedAt   ISO date string used for cache-busting.
 * @returns {string|null}
 */
export const resolvePhotoUrl = (photoValue, updatedAt = null) => {
  if (!photoValue) return null;

  let resolvedUrl;

  if (/^https?:\/\//i.test(photoValue)) {
    // Full URL already — but may have wrong host or path prefix.
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(photoValue)) {
      // Rewrite localhost URLs to the real backend host.
      try {
        const url = new URL(photoValue);
        let path = url.pathname.replace(/^\/+/, '').replace(/^api\//i, '');
        if (!path.startsWith('storage/')) path = 'storage/' + path;
        resolvedUrl = `${backendBaseUrl}/${path}`;
      } catch {
        return null;
      }
    } else {
      // Production URL: strip any accidental /api/storage/ prefix.
      resolvedUrl = photoValue.replace(/\/api\/storage\//i, '/storage/');
    }
  } else {
    // Relative path — prepend backend base + /storage/.
    const normalized = String(photoValue).replace(/^\/+/, '').replace(/^api\//i, '');
    const storagePath = normalized.startsWith('storage/')
      ? normalized
      : `storage/${normalized}`;
    resolvedUrl = `${backendBaseUrl}/${storagePath}`;
  }

  if (resolvedUrl && updatedAt) {
    const ts = new Date(updatedAt).getTime();
    if (!isNaN(ts)) resolvedUrl += `?v=${ts}`;
  }

  return resolvedUrl;
};
