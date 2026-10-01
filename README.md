# QueueTunes

QueueTunes interleaves Spotify podcast episodes with music and starts the result on a Spotify Connect device.

1. Log in with Spotify and select recent episodes from followed shows.
2. Choose **My songs** or a **Playlist URL**, then set songs per episode and randomization.
3. Confirm **Play now** to replace playback with the merged sequence.

Playback changes your current Spotify session; this is not a read-only playlist preview.

## Hosted app and access

[Open the hosted app](https://happy-ground-0d8a70103.4.azurestaticapps.net/) — Spotify sign-in and app access are required. This is **not an unrestricted public demo**. Playback requires Spotify Premium and an available Spotify Connect device. A public source repository would not grant access to the deployed app's Spotify credentials or allowlist.

The unauthenticated HTML and JavaScript were reachable on October 1, 2026. Authenticated onboarding, backend availability, and playback were not verified in that check. See [Spotify restrictions and release gates](docs/runbook.md#spotify-access-and-public-release-gates).

## Local development

Use Node.js 22 LTS. The frontend uses React 18, TypeScript, Vite, Tailwind CSS, and Vitest; the backend uses Express and a local JSON episode cache.

```bash
npm --prefix frontend ci
npm --prefix backend ci
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

Fill in your own Spotify app configuration, then run `npm start` from each directory in separate terminals. The frontend is at `http://127.0.0.1:3000`; the backend defaults to port `5333`. Register the exact frontend redirect URI in the Spotify Developer Dashboard.

Only public configuration belongs in `VITE_*` variables: Vite embeds them in the browser bundle. Never put a client secret or access/refresh token there.

See the [runbook](docs/runbook.md) for setup, checks, deployment notes, and known limitations, and the [wizard specification](docs/specs/queue-tunes-v2.md) for intended behavior.

## License

QueueTunes' original code and documentation are licensed under the [ISC License](LICENSE), matching the backend's existing license declaration. Third-party dependencies and assets retain their own licenses; the project license does not relicense Spotify content or third-party icons.

Runtime dependency notices ship with the [frontend](frontend/public/third-party-notices.txt) and [backend](backend/THIRD_PARTY_NOTICES.txt). After changing dependencies, regenerate them with `node scripts/generate-third-party-notices.mjs` after installing both lockfiles. The current favicon is an original geometric design covered by ISC.
