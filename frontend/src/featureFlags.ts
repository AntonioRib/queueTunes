/** Feature flags for the app. Toggle these to enable/disable features. */

/**
 * Show the device picker modal when no active Spotify device is found at
 * the moment of "Play now". The v2 wizard always uses the picker path;
 * this flag lets us disable it for smoke tests.
 */
export const ENABLE_DEVICE_PICKER = true;

/**
 * Hide episodes marked as fully played via Spotify's `resume_point`.
 * Requires the `user-read-playback-position` scope — turn off if it
 * causes auth errors during development.
 */
export const HIDE_PLAYED_EPISODES = false;

/**
 * Cache the user's followed shows in localStorage (6h TTL) so the
 * wizard doesn't re-paginate `/v1/me/shows` on every render. The
 * refresh icon in Step 1 still forces a fresh fetch.
 */
export const USE_MY_SHOWS_CACHE = true;
