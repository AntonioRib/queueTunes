import env from 'react-dotenv';

/**
 * Base URL for the Spotify Web API (all `/v1/*` endpoints).
 * Change here if Spotify ever ships v2 or a regional host.
 */
export const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

/**
 * Base URL for the Spotify Accounts host (OAuth token exchange).
 */
export const SPOTIFY_ACCOUNTS_BASE = 'https://accounts.spotify.com';

/**
 * Base URL for our own Express backend. Sourced from `REACT_APP_BACKEND_URL`
 * so the same build points at localhost in dev and Azure App Service in prod.
 */
export const BACKEND_API_BASE: string = env.REACT_APP_BACKEND_URL;

/**
 * Join a Spotify Web API path (must start with `/`) to the API base.
 * @example spotifyUrl('/me/player/devices') // → 'https://api.spotify.com/v1/me/player/devices'
 */
export const spotifyUrl = (path: string): string => `${SPOTIFY_API_BASE}${path}`;

/**
 * Join a Spotify Accounts path (must start with `/`) to the accounts base.
 * @example accountsUrl('/api/token') // → 'https://accounts.spotify.com/api/token'
 */
export const accountsUrl = (path: string): string => `${SPOTIFY_ACCOUNTS_BASE}${path}`;

/**
 * Join a path (must start with `/`) to our own backend base URL.
 * @example backendUrl('/api/token') // → 'https://…azurewebsites.net/api/token'
 */
export const backendUrl = (path: string): string => `${BACKEND_API_BASE}${path}`;
