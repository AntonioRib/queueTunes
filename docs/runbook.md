# Development

## Configuration

Follow the [README](../README.md) setup using Node.js 22 (`nvm use`).

| File | Settings |
| --- | --- |
| `frontend/.env.local` | `VITE_SPOTIFY_CLIENT_ID`, `VITE_SPOTIFY_REDIRECT_URL`, `VITE_SPOTIFY_AUTH_URL`, `VITE_BACKEND_URL` |
| `backend/.env` | `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `ALLOWED_ORIGINS`, `PORT` (default `5333`) |

Use your own Spotify app's client ID in both files. Keep its secret server-side; all `VITE_*` values are public and embedded at build time. `ALLOWED_ORIGINS` is a comma-separated frontend-origin list, not authentication.

Register `http://127.0.0.1:3000` exactly. Spotify [rejects `localhost` redirects](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri); production requires HTTPS. If Vite chooses another port, fix the port or update the redirect consistently.

## Checks

Run from the repository root:

```bash
npm --prefix frontend run lint
npm --prefix frontend test
npm --prefix frontend run build
node --check backend/server.js
node --check backend/episodeCache.js
node --test scripts/release-readiness.test.mjs
node scripts/generate-third-party-notices.mjs --check
npm --prefix frontend audit
npm --prefix backend audit
```

After dependency changes, install both lockfiles and run `node scripts/generate-third-party-notices.mjs`. Keep the generated notices in distributions. The backend has syntax checks, not a configured test/lint suite.

## Spotify limitations

Login uses PKCE and browser token storage. The hosted app is approved for public use; no separate access approval is needed. Playback requires Spotify Premium and an available Spotify Connect device.

If you run your own instance, your Spotify app may have [Development Mode](https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security) restrictions. [Newer playlist rules](https://developer.spotify.com/documentation/web-api/references/changes/february-2026) may affect the current app-token playlist proxy with new apps; fresh-app compatibility is unverified.

For 403 errors, check app access and Premium; for 429, respect `Retry-After`; for CORS errors, check `ALLOWED_ORIGINS`. Sign in again after scope changes.

## Deployment

Workflows target Azure Static Web Apps and App Service using your own resources and credentials. Automatic deployments require successful main-branch push CI and use its exact commit; PR previews are disabled. Manual backend deployment is main-only. Frontend output is `frontend/build/`.

Before deploying, verify Azure uses Node 22 and configure the GitHub `Production` environment's approval/branch restrictions; these were unset at the October 1, 2026 check. Changing build/runtime configuration here does not update Azure settings. Keep `.env` files and backend cache data out of Git.
