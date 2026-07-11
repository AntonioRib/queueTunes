import axios from 'axios';
import { SpotifyEpisode } from '../Models/SpotifyEpisode';
import { backendUrl } from '../config/endpoints';

/**
 * Maximum number of show ids per HTTP request.
 * Must stay in lockstep with `MAX_SHOW_IDS` on the backend.
 */
const MAX_IDS_PER_REQUEST = 100;

/**
 * Split `arr` into chunks of at most `size` items. Preserves order.
 *
 * @param arr - Array to split.
 * @param size - Max items per chunk (>= 1).
 * @returns Array of chunks. Empty input yields `[]`.
 */
const chunk = <T,>(arr: T[], size: number): T[][] => {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        out.push(arr.slice(i, i + size));
    }
    return out;
};

/**
 * Fetch the latest N episodes for one chunk of shows from the backend
 * SWR cache (`POST /api/shows/episodes`). Never throws; returns an empty
 * map on failure so a single flaky chunk doesn't blow up the whole call.
 */
const requestChunk = async (
    showIds: string[],
    limit: number,
): Promise<Record<string, SpotifyEpisode[]>> => {
    try {
        const response = await axios.post<Record<string, SpotifyEpisode[]>>(
            backendUrl('/api/shows/episodes'),
            { showIds, limit },
        );
        return response.data || {};
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('Error fetching batched show episodes:', msg);
        return {};
    }
};

/**
 * Batch-fetch the latest episodes for the given show ids via the backend
 * SWR cache. Requests are chunked at `MAX_IDS_PER_REQUEST` and issued in
 * parallel.
 *
 * @param showIds - Spotify show ids.
 * @param limit - Max episodes per show. Default 5.
 * @returns Map keyed by show id. Shows with no episodes (or a failed
 * chunk) are simply absent.
 * @example
 *   const byShow = await GetShowsEpisodesBatch(['abc', 'def'], 3);
 *   byShow.abc?.forEach(ep => console.log(ep.name));
 */
export const GetShowsEpisodesBatch = async (
    showIds: string[],
    limit: number = 5,
): Promise<Record<string, SpotifyEpisode[]>> => {
    if (showIds.length === 0) return {};

    const chunks = chunk(showIds, MAX_IDS_PER_REQUEST);
    const results = await Promise.all(chunks.map(c => requestChunk(c, limit)));
    return Object.assign({}, ...results);
};
