import axios from 'axios';
import { PlaylistInfo } from '../Models/PlaylistInfo';
import { getValidAccessToken } from '../Utils/Login';
import { backendUrl, spotifyUrl } from '../config/endpoints';

/**
 * Fetch a Spotify playlist's metadata (name, followers, track list).
 *
 * Tries the backend proxy first (which uses the app token and works
 * without a user login for public playlists). Falls back to the user's
 * OAuth token for private / user-followed playlists.
 *
 * @param playlistId - Bare Spotify playlist id, no URL, no query params.
 * @returns The playlist info, or `undefined` if both fetches fail.
 */
export const GetPlaylistInfo = async (playlistId: string): Promise<PlaylistInfo | undefined> => {
    try {
        const response = await axios.get<PlaylistInfo>(backendUrl(`/api/playlist/${playlistId}`));
        return response.data;
    } catch (backendError: unknown) {
        const status = axios.isAxiosError(backendError) ? backendError.response?.status : undefined;
        console.log('Backend playlist proxy failed, trying user token…', status);
    }

    const userToken = await getValidAccessToken();
    if (!userToken) return undefined;

    try {
        const response = await axios.get<PlaylistInfo>(
            spotifyUrl(`/playlists/${playlistId}`),
            { headers: { Authorization: `Bearer ${userToken}` } },
        );
        return response.data;
    } catch (error: unknown) {
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        console.error('User-token playlist fetch also failed:', status);
        return undefined;
    }
};