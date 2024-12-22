import axios from 'axios';
import { getFromLocalStorageWithExpiry } from '../Utils/LocalStorage';

export const SkipToNext = async () => {
    const url = 'https://api.spotify.com/v1/me/player/next';
    const token = getFromLocalStorageWithExpiry('access_token');
    return await axios.post(url, null, {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    }).then((response: { data: any; }) => {
        console.log('Skipped to next track:', response.data);
        return response.data;
    }).catch((error: any) => {
        console.error('Error skipping to next track:', error.response?.data || error.message);
        return undefined;
    });
};
