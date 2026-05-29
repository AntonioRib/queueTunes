import axios from 'axios';
import { getValidAccessToken } from '../Utils/Login';

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

export const GetMyShows = async (): Promise<SpotifyShow[]> => {
    const url = 'https://api.spotify.com/v1/me/shows';
    const token = await getValidAccessToken();
    const allShows: SpotifyShow[] = [];
    let offset = 0;
    const limit = 50;

    try {
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
    } catch (error: any) {
        console.error('Error fetching shows:', error.response?.data || error.message);
        return allShows;
    }
};
