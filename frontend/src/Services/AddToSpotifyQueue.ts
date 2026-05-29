import axios from 'axios';
import { getValidAccessToken } from '../Utils/Login';

export const AddToSpotifyQueue = async (trackUri: string) => {
    const url = 'https://api.spotify.com/v1/me/player/queue';
    const token = await getValidAccessToken();
    const params = {
        uri: trackUri,
    };

    return await axios.post(url, null, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        params,
    }).then((response: { data: any; }) => {
        console.log('Track added to queue:', response.data); // Check for a 204 status
        return response.data;
    }).catch((error: any) => {
        console.error('Error adding track to queue:', error.response?.data || error.message);
        console.error(error);
        return undefined;
    });
};
