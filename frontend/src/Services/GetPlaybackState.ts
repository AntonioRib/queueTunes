import axios from 'axios';
import { getFromLocalStorageWithExpiry } from '../Utils/LocalStorage';

export const GetPlaybackState = async (): Promise<any> => {
    const url = 'https://api.spotify.com/v1/me/player';
    const token = getFromLocalStorageWithExpiry('access_token');

    return await axios.get(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    }).then((response: { data: any; }) => {
        console.log('Playback state:', response.data);
        return response.data;
    }).catch((error: any) => {
        console.error('Error getting playback state:', error.response?.data || error.message);
        return undefined;
    });
};
