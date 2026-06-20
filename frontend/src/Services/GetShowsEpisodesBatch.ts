import axios from 'axios';
import env from 'react-dotenv';
import { SpotifyEpisode } from './GetShowEpisodes';

export const GetShowsEpisodesBatch = async (
    showIds: string[],
    limit: number = 5,
): Promise<Record<string, SpotifyEpisode[]>> => {
    if (showIds.length === 0) return {};
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
