# QueueTunes

Mix Spotify podcast episodes with music: pick episodes, choose saved songs or a playlist, then **Play now** on a Spotify Connect device. This replaces your current playback.

[Open the app](https://happy-ground-0d8a70103.4.azurestaticapps.net/) — available to anyone with Spotify Premium. Sign in and connect a Spotify device to play.

## Run locally

Requires Node.js 22 and your own Spotify Developer app.

```bash
npm --prefix frontend ci
npm --prefix backend ci
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

Fill in the configuration, then run `npm start` in each directory in separate terminals. Open `http://127.0.0.1:3000` and register that exact Spotify redirect URI. Never put secrets in `VITE_*` variables.

Built with React, TypeScript, Vite, Tailwind, and Express. See [setup, checks, and limitations](docs/runbook.md).

## License

[ISC](LICENSE). Third-party notices: [frontend](frontend/public/third-party-notices.txt) · [backend](backend/THIRD_PARTY_NOTICES.txt).
