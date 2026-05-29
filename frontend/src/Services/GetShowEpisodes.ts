import axios from 'axios';
import { getValidAccessToken } from '../Utils/Login';

export interface SpotifyEpisode {
    id: string;
    name: string;
    uri: string;
    release_date: string;
    duration_ms: number;
    images: { url: string; height: number; width: number }[];
    resume_point?: { fully_played: boolean; resume_position_ms: number };
    show?: { id: string; name: string; images: { url: string; height: number; width: number }[] };
}

interface ShowEpisodesResponse {
    items: SpotifyEpisode[];
    total: number;
    next: string | null;
}

export const GetShowEpisodes = async (showId: string, limit: number = 5): Promise<SpotifyEpisode[]> => {
    const url = `https://api.spotify.com/v1/shows/${showId}/episodes`;
    const token = await getValidAccessToken();

    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await axios.get<ShowEpisodesResponse>(url, {
                headers: { Authorization: `Bearer ${token}` },
                params: { limit },
            });
            return response.data.items;
        } catch (error: any) {
            if (error.response?.status === 429) {
                const retryAfter = Number(error.response.headers['retry-after'] || 2);
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                continue;
            }
            console.error(`Error fetching episodes for show ${showId}:`, error.response?.data || error.message);
            return [];
        }
    }
    return [];
};
