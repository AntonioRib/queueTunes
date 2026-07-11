import axios from 'axios';
import { getValidAccessToken } from '../Utils/Login';
import { spotifyUrl } from '../config/endpoints';

/**
 * Options accepted by {@link PlayUris}.
 */
export interface PlayUrisOptions {
    /** Optional AbortSignal so callers can cancel the in-flight request. */
    signal?: AbortSignal;
    /** Optional target device. Omit to play on the currently active device. */
    deviceId?: string;
}

/**
 * Play the given URIs immediately, atomically replacing whatever the user
 * was hearing on Spotify. Wraps `PUT /v1/me/player/play` with `{ uris }`.
 *
 * This is the only write in the wizard's hot path — no queue appending,
 * no skipping, no queue introspection.
 *
 * Known error modes:
 * - 401 → the axios interceptor in `Utils/Login` refreshes + retries.
 * - 403 → no active device or a Premium restriction. Surface as failure.
 * - 404 → device gone. Surface as failure so the caller can re-open the picker.
 * - `canceled` (Axios' `AbortController` signal) → returns `false` silently.
 *
 * @param uris - Spotify URIs (`spotify:episode:...`, `spotify:track:...`) in
 * play order.
 * @param options - Optional abort signal / target device id.
 * @returns `true` if Spotify accepted the request (HTTP 204). `false` on
 * cancellation or any HTTP error.
 * @example
 *   const controller = new AbortController();
 *   const ok = await PlayUris(['spotify:episode:abc', 'spotify:track:xyz'], {
 *     signal: controller.signal,
 *   });
 */
export const PlayUris = async (
    uris: string[],
    options: PlayUrisOptions = {},
): Promise<boolean> => {
    if (uris.length === 0) return false;

    const token = await getValidAccessToken();
    if (!token) return false;

    const authHeader = { Authorization: `Bearer ${token}` };
    const deviceParams = options.deviceId ? { device_id: options.deviceId } : undefined;

    // Turn shuffle OFF first — otherwise Spotify reorders our carefully
    // interleaved URIs. Best-effort: log & continue on failure so the
    // main play write still runs.
    try {
        await axios.put(spotifyUrl('/me/player/shuffle'), null, {
            headers: authHeader,
            params: { state: false, ...(options.deviceId ? { device_id: options.deviceId } : {}) },
            signal: options.signal,
        });
    } catch (error: unknown) {
        if (axios.isCancel(error)) return false;
        if (axios.isAxiosError(error)) {
            console.warn(
                'Disabling shuffle failed (continuing):',
                error.response?.status,
                error.response?.data ?? error.message,
            );
        } else {
            console.warn('Disabling shuffle failed (continuing):', error);
        }
    }

    const url = spotifyUrl('/me/player/play');
    try {
        await axios.put(
            url,
            { uris },
            {
                headers: authHeader,
                params: deviceParams,
                signal: options.signal,
            },
        );
        return true;
    } catch (error: unknown) {
        if (axios.isCancel(error)) return false;
        if (axios.isAxiosError(error)) {
            console.error(
                'PlayUris failed:',
                error.response?.status,
                error.response?.data ?? error.message,
            );
        } else {
            console.error('PlayUris failed:', error);
        }
        return false;
    }
};
