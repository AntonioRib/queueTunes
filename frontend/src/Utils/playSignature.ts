/**
 * Persisted shape of the "last successful play" marker used to power
 * the 30-second re-tap warning. Stored under {@link LAST_PLAY_KEY}.
 *
 * Only the timestamp is compared today. Structured as an object so a
 * future revision can add a signature (see follow-up in review) without
 * a storage migration.
 */
export interface LastPlayMarker {
    at: number;
}

/** localStorage key for the last-play marker. */
export const LAST_PLAY_KEY = 'wizard_last_play_signature';

/**
 * Read the last-play marker written by {@link writeLastPlay}.
 * Silently returns `null` if the key is missing or corrupt.
 */
export const readLastPlay = (): LastPlayMarker | null => {
    try {
        const raw = localStorage.getItem(LAST_PLAY_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as LastPlayMarker;
        if (typeof parsed?.at !== 'number') return null;
        return parsed;
    } catch {
        return null;
    }
};

/**
 * Write the last-play marker after a successful `Play now`.
 *
 * @param at - Epoch millis (usually `Date.now()`).
 */
export const writeLastPlay = (at: number): void => {
    try {
        localStorage.setItem(LAST_PLAY_KEY, JSON.stringify({ at }));
    } catch {
        // localStorage full / unavailable — non-fatal.
    }
};
