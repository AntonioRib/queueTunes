import Axios from 'axios';
import axios from 'axios';
import env from "react-dotenv";
import { getFromLocalStorageWithExpiry, setLocalStorageWithExpiry } from './LocalStorage';
import { base64encode, generateRandomString, sha256 } from './Crypto';
import { HIDE_PLAYED_EPISODES } from '../featureFlags';

const client_id = env.REACT_APP_SPOTIFY_CLIENT_ID;
const redirect_uri = env.REACT_APP_SPOTIFY_REDIRECT_URL;
const auth_uri = env.REACT_APP_SPOTIFY_AUTH_URL;
const authUrl = new URL(auth_uri);

const SCOPES = [
    'user-read-currently-playing',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-library-read',
    ...(HIDE_PLAYED_EPISODES ? ['user-read-playback-position'] : []),
];

export const logInWithSpotify = async (customRedirectUri?: string) => {
    let codeVerifier = localStorage.getItem('code_verifier');

    if (!codeVerifier) {
        codeVerifier = generateRandomString(64);
        localStorage.setItem('code_verifier', codeVerifier);
    }

    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);

    const effectiveRedirectUri = customRedirectUri || redirect_uri;
    if (customRedirectUri) {
        localStorage.setItem('custom_redirect_uri', customRedirectUri);
    }

    authUrl.search = new URLSearchParams({
        client_id,
        redirect_uri: effectiveRedirectUri,
        response_type: 'code',
        scope: SCOPES.join(' '),
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
    }).toString();

    window.location.href = authUrl.toString();
};

export const getToken = async () => {
    const token = getFromLocalStorageWithExpiry('access_token');
    if (token) return [token, true];

    // Try refreshing with stored refresh_token before falling back
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
        const refreshed = await refreshAccessToken(refreshToken);
        if (refreshed) return [refreshed, true];
    }

    const urlParams = new URLSearchParams(window.location.search);

    let code = urlParams.get('code') as string;
    if (code) return [await requestToken(code), true];

    const publicToken = getFromLocalStorageWithExpiry('public_access_token');
    if (publicToken) return [publicToken, false];

    const access_token = window.location.hash.split('&')[0].split('=')[1];
    if (access_token) {
        setLocalStorageWithExpiry('public_access_token', access_token, 3600);
        window.location.hash = '';
        return [access_token, false];
    }

    return [null, false];
};

const requestToken = async (code: string) => {
    const code_verifier = localStorage.getItem('code_verifier') as string;
    const customRedirect = localStorage.getItem('custom_redirect_uri');
    const effectiveRedirectUri = customRedirect || redirect_uri;
    if (customRedirect) localStorage.removeItem('custom_redirect_uri');

    const body = {
        code,
        client_id,
        redirect_uri: effectiveRedirectUri,
        code_verifier,
        grant_type: 'authorization_code',
    };

    const { data: response } = await Axios.post<{
        access_token: string;
        token_type: string;
        expires_in: number;
        refresh_token: string;
    }>('https://accounts.spotify.com/api/token', body, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    if (response.access_token) {
        // Store with 5min buffer so we refresh before Spotify actually expires it
        setLocalStorageWithExpiry('access_token', response.access_token, (response.expires_in - 300) * 1000);
        axios.defaults.headers.common['Authorization'] = 'Bearer ' + response.access_token;
        localStorage.setItem('refresh_token', response.refresh_token);
    }

    return response.access_token;
};

const refreshAccessToken = async (refreshToken: string): Promise<string | null> => {
    try {
        const body = {
            client_id,
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        };

        const { data: response } = await Axios.post<{
            access_token: string;
            token_type: string;
            expires_in: number;
            refresh_token?: string;
        }>('https://accounts.spotify.com/api/token', body, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        if (response.access_token) {
            // Store with 5min buffer so we refresh before Spotify actually expires it
            setLocalStorageWithExpiry('access_token', response.access_token, (response.expires_in - 300) * 1000);
            axios.defaults.headers.common['Authorization'] = 'Bearer ' + response.access_token;
            if (response.refresh_token) {
                localStorage.setItem('refresh_token', response.refresh_token);
            }
            return response.access_token;
        }
        return null;
    } catch {
        localStorage.removeItem('refresh_token');
        return null;
    }
};

export const cleanTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('public_access_token');
    localStorage.removeItem('code_verifier');
    delete axios.defaults.headers.common['Authorization'];
};

/**
 * Returns a valid access token, refreshing if expired.
 * Use this in services instead of reading localStorage directly.
 */
export const getValidAccessToken = async (): Promise<string | null> => {
    const token = getFromLocalStorageWithExpiry('access_token');
    if (token) return token;

    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
        return await refreshAccessToken(refreshToken);
    }
    return null;
};

// Axios interceptor: auto-refresh token on 401 and retry the request
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('accounts.spotify.com')
        ) {
            originalRequest._retry = true;

            if (!isRefreshing) {
                isRefreshing = true;
                const refreshToken = localStorage.getItem('refresh_token');
                refreshPromise = refreshToken ? refreshAccessToken(refreshToken) : Promise.resolve(null);
                refreshPromise.finally(() => { isRefreshing = false; });
            }

            const newToken = await refreshPromise;
            if (newToken) {
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                return axios(originalRequest);
            }

            // Refresh failed — tokens are invalid, force re-login
            cleanTokens();
            logInWithSpotify();
            return new Promise(() => { }); // halt the chain, page is redirecting
        }
        return Promise.reject(error);
    }
);