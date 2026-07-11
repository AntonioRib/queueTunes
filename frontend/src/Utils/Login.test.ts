/**
 * Unit tests for Utils/Login.ts.
 *
 * We only cover pure/near-pure helpers here:
 *   - resolveRedirectUri
 *   - cleanCodeFromUrl
 *   - getValidAccessToken (with mocked axios + toast)
 *
 * TODO(integration-test): the full logInWithSpotify redirect flow and the
 * axios 401 interceptor need heavy mocking of `window.location` and are
 * better covered by an end-to-end/integration test.
 */
import { beforeEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import { strings } from '../strings';
import { setLocalStorageWithExpiry } from './LocalStorage';

// Mock axios (both default `axios` and named-imported `Axios` resolve to the
// same default export). We register interceptors + `isAxiosError` here so
// the module-load-time interceptor registration doesn't crash.
vi.mock('axios', () => {
    const post = vi.fn();
    const use = vi.fn();
    const isAxiosError = vi.fn();
    const mockAxios = {
        post,
        defaults: { headers: { common: {} as Record<string, string> } },
        interceptors: { response: { use } },
        isAxiosError,
    };
    return { default: mockAxios };
});

// Mock react-hot-toast so we can assert on toast.error calls.
vi.mock('react-hot-toast', () => ({
    default: { error: vi.fn(), success: vi.fn() },
}));

// Env vars are read at module load; stub them BEFORE importing Login.
const stubBaseEnv = () => {
    vi.stubEnv('VITE_SPOTIFY_CLIENT_ID', 'test-client-id');
    vi.stubEnv('VITE_SPOTIFY_AUTH_URL', 'https://accounts.spotify.com/authorize');
};

interface LoadedModules {
    Login: typeof import('./Login');
    axios: { default: { post: Mock; isAxiosError: Mock; defaults: { headers: { common: Record<string, string> } } } };
    toast: { default: { error: Mock; success: Mock } };
}

/**
 * Fresh-import Login.ts (and its mocked deps) so module-level state like
 * `sessionExpiredHandled` starts clean each test.
 */
const loadFreshLogin = async (redirectUrl?: string): Promise<LoadedModules> => {
    vi.resetModules();
    stubBaseEnv();
    if (redirectUrl === undefined) {
        vi.stubEnv('VITE_SPOTIFY_REDIRECT_URL', '');
    } else {
        vi.stubEnv('VITE_SPOTIFY_REDIRECT_URL', redirectUrl);
    }
    const Login = await import('./Login');
    const axios = (await import('axios')) as unknown as LoadedModules['axios'];
    const toast = (await import('react-hot-toast')) as unknown as LoadedModules['toast'];
    return { Login, axios, toast };
};

beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    // Reset URL back to a known baseline; individual tests may override.
    window.history.replaceState({}, '', '/');
});

describe('resolveRedirectUri', () => {
    it('returns the env value when set', async () => {
        const { Login } = await loadFreshLogin('https://example.com/callback');
        expect(Login.resolveRedirectUri()).toBe('https://example.com/callback');
    });

    it('falls back to window.location.origin when env is unset', async () => {
        const { Login } = await loadFreshLogin('');
        expect(Login.resolveRedirectUri()).toBe(window.location.origin);
    });
});

describe('cleanCodeFromUrl', () => {
    it('strips ?code and ?state via history.replaceState', async () => {
        const { Login } = await loadFreshLogin('');
        window.history.replaceState({}, '', '/callback?code=abc&state=xyz#frag');
        expect(window.location.search).toBe('?code=abc&state=xyz');

        Login.cleanCodeFromUrl();

        expect(window.location.search).toBe('');
        expect(window.location.hash).toBe('#frag');
    });

    it('is a no-op when neither code nor state is present', async () => {
        const { Login } = await loadFreshLogin('');
        window.history.replaceState({}, '', '/somewhere?keep=me');
        Login.cleanCodeFromUrl();
        expect(window.location.search).toBe('?keep=me');
    });
});

describe('getValidAccessToken', () => {
    it('returns the current access token when it is not expired', async () => {
        const { Login, axios } = await loadFreshLogin('');
        setLocalStorageWithExpiry('access_token', 'current-token', 60_000);

        const token = await Login.getValidAccessToken();

        expect(token).toBe('current-token');
        expect(axios.default.post).not.toHaveBeenCalled();
    });

    it('returns null when no access_token and no refresh_token', async () => {
        const { Login, axios } = await loadFreshLogin('');
        expect(await Login.getValidAccessToken()).toBeNull();
        expect(axios.default.post).not.toHaveBeenCalled();
    });

    it('refreshes via the refresh endpoint and returns the new token on success', async () => {
        const { Login, axios } = await loadFreshLogin('');
        localStorage.setItem('refresh_token', 'refresh-abc');
        axios.default.post.mockResolvedValueOnce({
            data: {
                access_token: 'brand-new-token',
                token_type: 'Bearer',
                expires_in: 3600,
                refresh_token: 'refresh-abc',
            },
        });

        const token = await Login.getValidAccessToken();

        expect(token).toBe('brand-new-token');
        expect(axios.default.post).toHaveBeenCalledTimes(1);
        const [url, body] = axios.default.post.mock.calls[0];
        expect(url).toContain('/api/token');
        expect(body).toMatchObject({
            grant_type: 'refresh_token',
            refresh_token: 'refresh-abc',
        });
    });

    it('on invalid_grant clears tokens, fires session-expired toast, and returns null', async () => {
        const { Login, axios, toast } = await loadFreshLogin('');
        localStorage.setItem('refresh_token', 'stale-refresh');
        setLocalStorageWithExpiry('access_token', 'stale', -1000); // already expired

        const err = {
            response: { status: 400, data: { error: 'invalid_grant' } },
        };
        axios.default.isAxiosError.mockImplementation((e: unknown) => e === err);
        axios.default.post.mockRejectedValueOnce(err);

        const token = await Login.getValidAccessToken();

        expect(token).toBeNull();
        expect(toast.default.error).toHaveBeenCalledWith(strings.auth.sessionExpired);
        expect(localStorage.getItem('access_token')).toBeNull();
        expect(localStorage.getItem('refresh_token')).toBeNull();
    });

    it('on non-invalid_grant refresh errors returns null without toast and keeps tokens', async () => {
        const { Login, axios, toast } = await loadFreshLogin('');
        localStorage.setItem('refresh_token', 'good-refresh');

        const err = { response: { status: 500, data: {} } };
        axios.default.isAxiosError.mockReturnValue(false); // treat as non-axios
        axios.default.post.mockRejectedValueOnce(err);

        const token = await Login.getValidAccessToken();

        expect(token).toBeNull();
        expect(toast.default.error).not.toHaveBeenCalled();
        expect(localStorage.getItem('refresh_token')).toBe('good-refresh');
    });
});

describe('cleanTokens', () => {
    it('removes access, refresh, public, and verifier keys and clears the Authorization header', async () => {
        const { Login, axios } = await loadFreshLogin('');
        localStorage.setItem('access_token', 'a');
        localStorage.setItem('refresh_token', 'r');
        localStorage.setItem('public_access_token', 'p');
        localStorage.setItem('code_verifier', 'v');
        axios.default.defaults.headers.common['Authorization'] = 'Bearer x';

        Login.cleanTokens();

        expect(localStorage.getItem('access_token')).toBeNull();
        expect(localStorage.getItem('refresh_token')).toBeNull();
        expect(localStorage.getItem('public_access_token')).toBeNull();
        expect(localStorage.getItem('code_verifier')).toBeNull();
        expect(axios.default.defaults.headers.common['Authorization']).toBeUndefined();
    });
});

describe('getToken', () => {
    it('returns the stored access token with authed=true when unexpired', async () => {
        const { Login } = await loadFreshLogin('');
        setLocalStorageWithExpiry('access_token', 'stored', 60_000);

        const [token, authed] = await Login.getToken();

        expect(token).toBe('stored');
        expect(authed).toBe(true);
    });

    it('returns [null, false] when nothing is available', async () => {
        const { Login } = await loadFreshLogin('');
        const [token, authed] = await Login.getToken();
        expect(token).toBeNull();
        expect(authed).toBe(false);
    });

    it('returns the stored public token with authed=false when only that is present', async () => {
        const { Login } = await loadFreshLogin('');
        setLocalStorageWithExpiry('public_access_token', 'pub', 60_000);

        const [token, authed] = await Login.getToken();

        expect(token).toBe('pub');
        expect(authed).toBe(false);
    });

    it('exchanges a ?code= URL param for an access token when a code_verifier is present', async () => {
        const { Login, axios } = await loadFreshLogin('');
        localStorage.setItem('code_verifier', 'verifier-abc');
        localStorage.setItem('oauth_redirect_uri', 'http://localhost:3000');
        window.history.replaceState({}, '', '/?code=fresh-code&state=xyz');

        axios.default.post.mockResolvedValueOnce({
            data: {
                access_token: 'exchanged-token',
                token_type: 'Bearer',
                expires_in: 3600,
                refresh_token: 'new-refresh',
            },
        });

        const [token, authed] = await Login.getToken();

        expect(token).toBe('exchanged-token');
        expect(authed).toBe(true);
        expect(localStorage.getItem('refresh_token')).toBe('new-refresh');
        // code_verifier is single-use and should be cleared post-exchange.
        expect(localStorage.getItem('code_verifier')).toBeNull();
        // ?code / ?state should be stripped from the URL.
        expect(window.location.search).toBe('');
    });

    it('bails out of the code exchange when code_verifier is missing', async () => {
        const { Login, axios } = await loadFreshLogin('');
        window.history.replaceState({}, '', '/?code=fresh-code');

        const [token, authed] = await Login.getToken();

        expect(token).toBeNull();
        expect(authed).toBe(false);
        expect(axios.default.post).not.toHaveBeenCalled();
        expect(window.location.search).toBe('');
    });
});
