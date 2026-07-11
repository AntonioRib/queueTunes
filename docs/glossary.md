# Glossary

Terminology for QueueTunes. Includes retired names so agents joining fresh don't get confused by legacy code.

- **QueueTunes** — the app. Web app that interleaves the user's Spotify podcast episodes with music.
- **Quick Queue (retired)** — the old tab that let the user bulk-add followed-show episodes to their Spotify queue. Now merged into Step 1 of the wizard.
- **Queue Tunes flow (retired)** — the old tab that took a pasted playlist URL and interleaved its songs with episodes already in the queue. Now Step 2 of the wizard.
- **Wizard** — the current single flow: **Step 1** (pick episodes) → **Step 2** (pick songs) → **Play now**.
- **Play now** — the atomic `PUT /v1/me/player/play` action that replaces the queue with the merged episode/song sequence. One request, no incremental appending, no queue introspection.
- **Song source** — the origin of the between-episode music. v1 options: **My songs** (a random slice of the user's Spotify Saved Tracks) and **Playlist URL** (a pasted Spotify playlist).
- **Backend episode cache** — the JSON-file-backed shared cache in the Express backend that fronts `/v1/shows/{id}/episodes`, exposed to the frontend as `POST /api/shows/episodes`.
- **SWR (stale-while-revalidate)** — the backend cache's behavior: return cached data immediately, then refresh in the background if the entry is stale.
- **App token** — the Spotify `client_credentials` token the backend obtains and uses for public endpoints (playlist metadata, show episodes). Not tied to any user.
- **User token** — the OAuth PKCE token the frontend obtains on login. Tied to the logged-in user; used for anything reading or writing personal data (`/me/*`, player control).
- **`resume_point`** — Spotify's per-user, per-episode listening progress. Only used when the `HIDE_PLAYED_EPISODES` flag is on, to filter out finished episodes.
