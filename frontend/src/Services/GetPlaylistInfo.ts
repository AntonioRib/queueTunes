import axios from 'axios';
import env from "react-dotenv";
import { PlaylistInfo } from '../Models/PlaylistInfo';
import { getFromLocalStorageWithExpiry } from '../Utils/LocalStorage';

export const GetPlaylistInfo = async (playlistId: string): Promise<PlaylistInfo | undefined> => {
    const instance = axios.create();

    // Try backend proxy first (works without user login for user-created playlists)
    try {
        const backendUrl = env.REACT_APP_BACKEND_TOKEN_URL.replace('/api/token', '');
        const response = await instance.get(`${backendUrl}/api/playlist/${playlistId}`);
        return response.data;
    } catch (backendError: any) {
        console.log('Backend proxy failed, trying user token...', backendError?.response?.status);
    }

    // Fall back to user's OAuth token (may work for some playlists the user follows)
    const userToken = getFromLocalStorageWithExpiry('access_token');
    if (!userToken) {
        return undefined;
    }

    try {
        const response = await instance.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
            headers: { Authorization: `Bearer ${userToken}` },
        });
        return response.data;
    } catch (error: any) {
        console.error('User token also failed:', error?.response?.status);
        return undefined;
    }
};