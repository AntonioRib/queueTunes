import axios from "axios";
import env from "react-dotenv";
import { SpotifyTokenResponse } from "../Models/SpotifyTokenResponse";
import secureLocalStorage from "react-secure-storage";

export const GetSpotifyToken = async (): Promise<SpotifyTokenResponse> => {
    const savedToken = secureLocalStorage.getItem('SPOTIFY_TOKEN') as SpotifyTokenResponse | null;
    if (savedToken && savedToken.expiration_time > Date.now()) {
        return savedToken;
    }

    const url = `${env.REACT_APP_BACKEND_URL}/api/token`
    return await axios.get(url, { timeout: 10000 })
        .then((response: { data: any; }) => {
            secureLocalStorage.setItem("SPOTIFY_TOKEN", response.data);
            return response.data;
        }).catch((error: any) => {
            console.error(error);
            return error;
        });
};