import axios from 'axios';
import { getValidAccessToken } from '../Utils/Login';
import { spotifyUrl } from '../config/endpoints';

/**
 * Spotify device shape returned by `GET /v1/me/player/devices`.
 * Only the fields the picker needs are declared.
 */
export interface SpotifyDevice {
    id: string;
    is_active: boolean;
    name: string;
    type: string;
    volume_percent: number;
}

/**
 * Fetch the list of devices Spotify Connect knows about for the current user.
 *
 * @returns Array of devices. Empty on any error (401/404/network) — callers
 * should treat "empty" as "no picker to show".
 */
export const GetAvailableDevices = async (): Promise<SpotifyDevice[]> => {
    const token = await getValidAccessToken();
    if (!token) return [];

    try {
        const response = await axios.get<{ devices: SpotifyDevice[] }>(
            spotifyUrl('/me/player/devices'),
            { headers: { Authorization: `Bearer ${token}` } },
        );
        return response.data.devices ?? [];
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error('Error fetching devices:', error.response?.data ?? error.message);
        } else {
            console.error('Error fetching devices:', error);
        }
        return [];
    }
};
