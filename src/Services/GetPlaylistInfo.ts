import axios from 'axios';
import { PlaylistInfo } from '../Models/PlaylistInfo';
import { GetSpotifyToken } from './GetSpotifyToken';

export const GetPlaylistInfo = async (playlistId: string): Promise<PlaylistInfo> => {
    const tokenResponse = await GetSpotifyToken();
    const token = tokenResponse.access_token;

    if (!token) {
        throw new Error('SPOTIFY_TOKEN is not defined in environment variables');
    }

    console.log("SPOTIFY_TOKEN:", token);

    const url = 'https://api.spotify.com/v1/playlists/';
    return await axios.get(`${url}${playlistId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }).then((response: { data: any; }) => {
        console.log(response.data);
        return response.data;
    }).catch((error: any) => {
        console.error(error);
        return undefined;
    });
};