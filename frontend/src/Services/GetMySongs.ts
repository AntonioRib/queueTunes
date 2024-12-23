import axios from 'axios';
import { getFromLocalStorageWithExpiry } from '../Utils/LocalStorage';
import { UserSavedTracks } from '../Models/UserSavedTracks';

export const GetMySongs = async (): Promise<UserSavedTracks> => {
    const url = 'https://api.spotify.com/v1/me/tracks';
    const token = getFromLocalStorageWithExpiry('access_token');

    return await axios.get(url, {
        params: {
            limit: 50,
        },
        headers: {
            Authorization: `Bearer ${token}`,
        }
    }).then((response: { data: any; }) => {
        console.log("My Songs fetched:", response.data);
        return response.data;
    }).catch((error: any) => {
        console.error('Error getting playback state:', error.response?.data || error.message);
        return undefined;
    });
};