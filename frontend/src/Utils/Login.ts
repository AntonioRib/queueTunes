import Axios from 'axios';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getFromLocalStorageWithExpiry, setLocalStorageWithExpiry } from './LocalStorage';
import { base64encode, generateRandomString, sha256 } from './Crypto';
import { HIDE_PLAYED_EPISODES } from '../featureFlags';
import { accountsUrl } from '../config/endpoints';
import { strings } from '../strings';

const client_id = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
/**
 * Redirect URI configured for the Spotify app. Must match one of the
 * Redirect URIs registered on the Spotify Developer Dashboard. Falls
 * back to `window.location.origin` at runtime if unset.
 */
const redirect_uri_env = import.meta.env.VITE_SPOTIFY_REDIRECT_URL;
const auth_uri = import.meta.env.VITE_SPOTIFY_AUTH_URL;
const authUrl = new URL(auth_uri);

/** Resolve the redirect URI to send Spotify. Env value if set, else runtime origin. */
export const resolveRedirectUri = (): string => redirect_uri_env || window.location.origin;

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

    const effectiveRedirectUri = customRedirectUri || resolveRedirectUri();
    // Persist the exact redirect used so `requestToken` sends the same
    // value back to Spotify (mismatch → invalid_grant).
    localStorage.setItem('oauth_redirect_uri', effectiveRedirectUri);

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
        // Refresh failed. If it was invalid_grant, handleInvalidGrant() already started
        // re-login. For transient failures we fall through to the public-token paths.
    }

    const urlParams = new URLSearchParams(window.location.search);

    let code = urlParams.get('code') as string;
    if (code) {
        const exchanged = await requestToken(code);
        if (exchanged) return [exchanged, true];
        // Fall through if the exchange failed (stale code, mismatched verifier, …).
    }

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

const requestToken = async (code: string): Promise<string | null> => {
    const code_verifier = localStorage.getItem('code_verifier');
    const effectiveRedirectUri =
        localStorage.getItem('oauth_redirect_uri') || resolveRedirectUri();

    // A missing code_verifier means the code has already been consumed
    // (or the localStorage was wiped). Don't attempt the exchange —
    // Spotify would return `invalid_grant` and surface as a runtime error.
    if (!code_verifier) {
        cleanCodeFromUrl();
        return null;
    }

    const body = {
        code,
        client_id,
        redirect_uri: effectiveRedirectUri,
        code_verifier,
        grant_type: 'authorization_code',
    };

    try {
        const { data: response } = await Axios.post<{
            access_token: string;
            token_type: string;
            expires_in: number;
            refresh_token: string;
        }>(accountsUrl('/api/token'), body, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        if (response.access_token) {
            // Store with 5min buffer so we refresh before Spotify actually expires it
            setLocalStorageWithExpiry('access_token', response.access_token, (response.expires_in - 300) * 1000);
            axios.defaults.headers.common['Authorization'] = 'Bearer ' + response.access_token;
            localStorage.setItem('refresh_token', response.refresh_token);
            // PKCE code_verifier is single-use; clear it now that the exchange succeeded
            localStorage.removeItem('code_verifier');
            localStorage.removeItem('oauth_redirect_uri');
            cleanCodeFromUrl();
            return response.access_token;
        }
        cleanCodeFromUrl();
        return null;
    } catch (error) {
        // Stale code / verifier mismatch / redirect mismatch surface as
        // `invalid_grant` — expected on a reload after login succeeded and
        // safe to swallow. Anything else is a real config/network problem
        // and deserves both a console.error and a toast.
        cleanCodeFromUrl();
        if (isInvalidGrantError(error)) {
            localStorage.removeItem('code_verifier');
            localStorage.removeItem('oauth_redirect_uri');
            return null;
        }
        console.error('OAuth code exchange failed:', error);
        toast.error(strings.auth.signInFailed);
        return null;
    }
};

/** Strip the `?code=` (and `state`) params from the current URL without a reload. */
export const cleanCodeFromUrl = (): void => {
    try {
        const url = new URL(window.location.href);
        if (!url.searchParams.has('code') && !url.searchParams.has('state')) return;
        url.searchParams.delete('code');
        url.searchParams.delete('state');
        window.history.replaceState({}, document.title, url.pathname + (url.search || '') + url.hash);
    } catch {
        // window / URL unavailable in some test harnesses; non-fatal.
    }
};

let sessionExpiredHandled = false;
const handleInvalidGrant = () => {
    if (sessionExpiredHandled) return;
    sessionExpiredHandled = true;
    toast.error(strings.auth.sessionExpired);
    cleanTokens();
    // Give the toast a moment to render before redirecting away
    setTimeout(() => { logInWithSpotify(); }, 800);
};

const isInvalidGrantError = (error: unknown): boolean => {
    if (!Axios.isAxiosError(error)) return false;
    const status = error.response?.status;
    const code = (error.response?.data as { error?: string } | undefined)?.error;
    return status === 400 && code === 'invalid_grant';
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
        }>(accountsUrl('/api/token'), body, {
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
    } catch (error) {
        // Only drop the refresh_token + force re-login when Spotify says it's actually invalid.
        // Network blips and 5xx errors leave the token in place so the next attempt can retry.
        if (isInvalidGrantError(error)) {
            handleInvalidGrant();
        }
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

            // Refresh failed. If it was an invalid_grant, refreshAccessToken has already
            // triggered the session-expired toast + re-login. Otherwise (network/5xx),
            // surface the original error so callers can decide what to do.
            const refreshTokenStillPresent = localStorage.getItem('refresh_token');
            if (!refreshTokenStillPresent) {
                handleInvalidGrant();
                return new Promise(() => { }); // halt the chain, page is redirecting
            }
            return Promise.reject(error);
        }
        return Promise.reject(error);
    }
);