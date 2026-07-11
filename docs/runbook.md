# Runbook

How to run QueueTunes locally, deploy it, and untangle the usual footguns.

## Prereqs

- **Node.js 18** (the backend runs on Node 18 on Azure; match locally to avoid surprises). Check `package.json` `engines` fields when present.
- A Spotify Developer app with a **Client ID**, **Client Secret**, and a **Redirect URI** registered exactly as `http://localhost:3000` (or whatever origin you'll use locally).

## Clone + install

```bash
git clone git@github.com:AntonioRib/queueTunes.git
cd queueTunes

# Frontend deps
cd frontend && npm install && cd ..

# Backend deps
cd backend && npm install && cd ..
```

## Env setup

### Frontend — `frontend/public/env.js`

Loaded by `react-dotenv` at runtime. Only the whitelisted keys are exposed to the browser bundle:

```js
window.env = {
  REACT_APP_SPOTIFY_CLIENT_ID: "…",
  REACT_APP_SPOTIFY_REDIRECT_URI: "http://localhost:3000",
  REACT_APP_BACKEND_URL: "http://localhost:5333",
  // Add feature-flag overrides here if needed (see src/featureFlags.ts).
};
```

### Backend — `backend/.env`

```env
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
ALLOWED_ORIGINS=http://localhost:3000
PORT=5333
```

- `ALLOWED_ORIGINS` is a comma-separated CORS allowlist.
- `PORT` defaults to `5333` if omitted.

## Run

Two terminals:

```bash
# Terminal 1 — frontend on http://localhost:3000
cd frontend && npm start

# Terminal 2 — backend on http://localhost:5333
cd backend && npm start
```

## Deploy

- **Backend:** Azure App Service (Node 18 runtime). Set the same env vars in the App Service configuration.
- **Frontend:** Azure Static Web Apps. The production build points `REACT_APP_BACKEND_URL` at the deployed App Service URL.
- **Cold start caveat:** Azure App Service on the free/consumption tier cold-starts the backend on first request, which can make the first `POST /api/shows/episodes` slow. Tracked as todo `azure-cold-start`.

## Common issues

- **`localhost` vs `127.0.0.1`** — these are different origins to the browser (separate localStorage, separate cookie jars). Pick one and stick with it; the Spotify redirect URI must match exactly.
- **Redirect URI mismatch** — the value in `frontend/public/env.js` MUST match the URI registered in the Spotify Developer Dashboard character-for-character, including trailing slashes.
- **Scope changes require re-login** — if you add or remove OAuth scopes, existing users must log out and log back in for the new token to carry the new scopes. `HIDE_PLAYED_EPISODES` needs `user-read-playback-position`, for example.
- **429 from Spotify** — the backend and services already retry with `Retry-After`. If you see repeated 429s, check that you're not calling `/v1/me/tracks` or `/v1/shows/{id}/episodes` outside the cached paths.
- **CORS errors** — ensure the frontend origin is in `ALLOWED_ORIGINS` on the backend.
