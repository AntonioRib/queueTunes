import axios from 'axios';
import { getFromLocalStorageWithExpiry } from '../Utils/LocalStorage';

export const PausePlayback = async () => {
    const url = 'https://api.spotify.com/v1/me/player/pause';
    const token = getFromLocalStorageWithExpiry('access_token');

    return await axios.put(url, null, {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    }).then((response: { data: any; }) => {
        return response.data;
    }).catch((error: any) => {
        console.error('Error pausing playback:', error.response?.data || error.message);
        return undefined;
    });
};
