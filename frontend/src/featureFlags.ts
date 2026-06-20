/** Feature flags for the app. Toggle these to enable/disable features. */

/** Show device picker modal when no active Spotify device is found */
export const ENABLE_DEVICE_PICKER = true;

/** Make Quick Queue the primary (first) tab instead of Queue Tunes */
export const QUICK_QUEUE_PRIMARY = true;

/** Hide episodes marked as fully played via Spotify's resume_point.
 *  Requires the `user-read-playback-position` scope — turn off if it causes auth errors. */
export const HIDE_PLAYED_EPISODES = false;

/** Fetch Quick Queue show episodes via the backend SWR cache
 *  (POST /api/shows/episodes) instead of calling Spotify directly per-show.
 *  Turn off to revert to the legacy per-show client-side fan-out. */
export const USE_BACKEND_EPISODE_CACHE = true;
