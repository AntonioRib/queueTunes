import axios from 'axios';
import { getValidAccessToken } from '../Utils/Login';
import { QueueState } from '../Models/QueueState';

export const GetSpotifyQueueState = async (): Promise<QueueState> => {
    const url = 'https://api.spotify.com/v1/me/player/queue';
    const token = await getValidAccessToken();

    return await axios.get(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    }).then((response: { data: any; }) => {
        console.log('Queue state:', response.data);
        console.log(response.data);
        return response.data;
    }).catch((error: any) => {
        console.error('Error getting queue state:', error.response?.data || error.message);
        console.error(error);
        return undefined;
    });
};
