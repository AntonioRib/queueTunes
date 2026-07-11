import axios from 'axios';
import { getValidAccessToken } from '../Utils/Login';
import { spotifyUrl } from '../config/endpoints';
import { SavedTracksResponse, SpotifyTrack } from '../Models/SpotifyTrack';

/**
 * Return value of {@link GetMySongsRandom}. `total` is the user's full
 * saved-track count; `tracks` is the returned window (may be up to
 * {@link WINDOW_SIZE} long, but shorter for small libraries).
 */
export interface RandomSavedTracks {
    tracks: SpotifyTrack[];
    total: number;
}

const WINDOW_SIZE = 50;
const SAVED_TRACKS_URL = spotifyUrl('/me/tracks');

/**
 * Fetch a random window of the user's Spotify Saved Tracks.
 *
 * Two Spotify calls:
 * 1. `GET /v1/me/tracks?limit=1` — to read `total`.
 * 2. `GET /v1/me/tracks?offset=X&limit=50` — with `X` picked uniformly
 *    in `[0, max(0, total - 50)]`.
 *
 * Handles small libraries gracefully: if `total <= 50`, offset is `0`
 * and the caller gets everything the user has (up to 50).
 *
 * @returns `{ tracks, total }`. On error, returns `{ tracks: [], total: 0 }`.
 * @throws Never. All axios errors are caught and logged.
 * @example
 *   const { tracks, total } = await GetMySongsRandom();
 *   if (tracks.length < needed) toast('Only have X saved songs.');
 */
export const GetMySongsRandom = async (): Promise<RandomSavedTracks> => {
    const token = await getValidAccessToken();
    if (!token) return { tracks: [], total: 0 };

    const authHeader = { Authorization: `Bearer ${token}` };

    try {
        const totalResp = await axios.get<SavedTracksResponse>(SAVED_TRACKS_URL, {
            headers: authHeader,
            params: { limit: 1 },
        });
        const total = totalResp.data.total ?? 0;
        if (total === 0) return { tracks: [], total: 0 };

        const maxOffset = Math.max(0, total - WINDOW_SIZE);
        const offset = maxOffset === 0 ? 0 : Math.floor(Math.random() * (maxOffset + 1));

        const pageResp = await axios.get<SavedTracksResponse>(SAVED_TRACKS_URL, {
            headers: authHeader,
            params: { offset, limit: WINDOW_SIZE },
        });

        const tracks = (pageResp.data.items ?? [])
            .map(item => item.track)
            .filter((t): t is SpotifyTrack => !!t && !!t.uri);

        return { tracks, total };
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error(
                'GetMySongsRandom failed:',
                error.response?.status,
                error.response?.data ?? error.message,
            );
        } else {
            console.error('GetMySongsRandom failed:', error);
        }
        return { tracks: [], total: 0 };
    }
};
