import axios from 'axios';
import { getValidAccessToken } from '../Utils/Login';

export interface SpotifyDevice {
    id: string;
    is_active: boolean;
    name: string;
    type: string;
    volume_percent: number;
}

export const GetAvailableDevices = async (): Promise<SpotifyDevice[]> => {
    const url = 'https://api.spotify.com/v1/me/player/devices';
    const token = await getValidAccessToken();

    try {
        const response = await axios.get<{ devices: SpotifyDevice[] }>(url, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.devices;
    } catch (error: any) {
        console.error('Error fetching devices:', error.response?.data || error.message);
        return [];
    }
};
