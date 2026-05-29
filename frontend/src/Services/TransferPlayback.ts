import axios from 'axios';
import { getValidAccessToken } from '../Utils/Login';

export const TransferPlayback = async (deviceId: string): Promise<boolean> => {
    const url = 'https://api.spotify.com/v1/me/player';
    const token = await getValidAccessToken();

    try {
        await axios.put(url, {
            device_ids: [deviceId],
            play: false,
        }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return true;
    } catch (error: any) {
        console.error('Error transferring playback:', error.response?.data || error.message);
        return false;
    }
};
