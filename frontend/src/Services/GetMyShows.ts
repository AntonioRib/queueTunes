import axios from 'axios';
import { getValidAccessToken } from '../Utils/Login';
import { USE_MY_SHOWS_CACHE } from '../featureFlags';

export interface SpotifyShow {
    id: string;
    name: string;
    images: { url: string; height: number; width: number }[];
    publisher: string;
}

interface SavedShowItem {
    added_at: string;
    show: SpotifyShow;
}

interface SavedShowsResponse {
    items: SavedShowItem[];
    total: number;
    next: string | null;
}

const CACHE_KEY = 'quick_queue_my_shows_cache_v1';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

interface CachedShows {
    shows: SpotifyShow[];
    fetchedAt: number;
}

const readCache = (): CachedShows | null => {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as CachedShows;
        if (!parsed || !Array.isArray(parsed.shows)) return null;
        return parsed;
    } catch {
        return null;
    }
};

const writeCache = (shows: SpotifyShow[]): void => {
    try {
        const payload: CachedShows = { shows, fetchedAt: Date.now() };
        localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch {
        // localStorage may be unavailable or full; non-fatal.
    }
};

const fetchAllShows = async (): Promise<SpotifyShow[]> => {
    const url = 'https://api.spotify.com/v1/me/shows';
    const token = await getValidAccessToken();
    const allShows: SpotifyShow[] = [];
    let offset = 0;
    const limit = 50;

    while (true) {
        const response = await axios.get<SavedShowsResponse>(url, {
            headers: { Authorization: `Bearer ${token}` },
            params: { limit, offset },
        });
        allShows.push(...response.data.items.map(item => item.show));
        if (!response.data.next) break;
        offset += limit;
    }
    return allShows;
};

export const GetMyShows = async (
    options: { forceRefresh?: boolean } = {},
): Promise<SpotifyShow[]> => {
    const { forceRefresh = false } = options;

    if (USE_MY_SHOWS_CACHE && !forceRefresh) {
        const cached = readCache();
        if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
            return cached.shows;
        }
    }

    try {
        const shows = await fetchAllShows();
        if (USE_MY_SHOWS_CACHE) writeCache(shows);
        return shows;
    } catch (error: any) {
        console.error('Error fetching shows:', error.response?.data || error.message);
        if (USE_MY_SHOWS_CACHE) {
            // On failure, fall back to any cached value (even if expired) rather
            // than returning an empty list.
            const stale = readCache();
            if (stale) return stale.shows;
        }
        return [];
    }
};
