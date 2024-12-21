import axios from "axios";
import env from "react-dotenv";
import { SpotifyTokenResponse } from "../Models/SpotifyTokenResponse";
import secureLocalStorage from "react-secure-storage";

export const GetSpotifyToken = async (): Promise<SpotifyTokenResponse> => {
    const savedToken = secureLocalStorage.getItem('SPOTIFY_TOKEN') as SpotifyTokenResponse | null;
    if (savedToken && savedToken.access_token && savedToken.expiration_time > Date.now()) {
        console.log("Saved Token:", savedToken);
        return savedToken;
    }

    const grantType = 'client_credentials';
    const clientId = env.SPOTIFY_CLIENT_ID;
    const clientSecret = env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret || !grantType) {
        throw new Error('SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, or GRANT_TYPE is not defined in environment variables');
    }

    const url = 'https://accounts.spotify.com/api/token';
    return await axios.post(url, {
        grant_type: grantType,
        client_id: clientId,
        client_secret: clientSecret,
    }, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    }).then((response: { data: any; }) => {
        const expirationTime = Date.now() + response.data.expires_in * 1000;
        response.data.expiration_time = expirationTime;
        secureLocalStorage.setItem("SPOTIFY_TOKEN", response.data);
        console.log(response.data);
        return response.data;
    }).catch((error: any) => {
        console.error(error);
        return error;
    });
};