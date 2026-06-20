import axios from 'axios';
import env from 'react-dotenv';
import { SpotifyEpisode } from './GetShowEpisodes';

// Must stay <= MAX_SHOW_IDS on the backend.
const MAX_IDS_PER_REQUEST = 100;

const chunk = <T,>(arr: T[], size: number): T[][] => {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        out.push(arr.slice(i, i + size));
    }
    return out;
};

const requestChunk = async (
    showIds: string[],
    limit: number,
): Promise<Record<string, SpotifyEpisode[]>> => {
    try {
        const response = await axios.post<Record<string, SpotifyEpisode[]>>(
            `${env.REACT_APP_BACKEND_URL}/api/shows/episodes`,
            { showIds, limit },
        );
        return response.data || {};
    } catch (error: any) {
        console.error(
            'Error fetching batched show episodes:',
            error.response?.data || error.message,
        );
        return {};
    }
};

export const GetShowsEpisodesBatch = async (
    showIds: string[],
    limit: number = 5,
): Promise<Record<string, SpotifyEpisode[]>> => {
    if (showIds.length === 0) return {};

    const chunks = chunk(showIds, MAX_IDS_PER_REQUEST);
    const results = await Promise.all(chunks.map(c => requestChunk(c, limit)));
    return Object.assign({}, ...results);
};
