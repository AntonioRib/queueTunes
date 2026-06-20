# QueueTunes - Project Context & Future Plans

## What is QueueTunes?
A React + TypeScript web app that interleaves podcast episodes with music in your Spotify queue. It has two main features:

1. **Quick Queue** — Browse your followed podcasts, see new episodes, and bulk-add them to your Spotify queue with one click
2. **Queue Tunes** — Take podcast episodes already in your Spotify queue and interleave them with songs from a playlist (e.g., Ep1 → Song → Song → Ep2 → Song → Song)

## Tech Stack
- **Frontend:** React 18 + TypeScript + Tailwind CSS, built with react-scripts
- **Routing:** react-router-dom v7 (BrowserRouter)
- **Auth:** Spotify OAuth PKCE flow with auto token refresh (tokens persist in localStorage)
- **Backend:** Minimal Express server (only used as a proxy for playlist info)
- **Environment:** react-dotenv with `public/env.js`

## Key Architecture Decisions
- **Feature flags** in `src/featureFlags.ts` control: device picker, Quick Queue as primary tab, hide played episodes
- **Token management:** `getValidAccessToken()` in `Utils/Login.ts` auto-refreshes expired tokens; all services use it
- **Episode caching:** localStorage with 1hr TTL, incremental fetches (2 episodes/show) when stale, full fetch (5/show) on first load or force refresh
- **Rate limit handling:** 300ms delay between API batches, retry up to 3 times on 429 with Retry-After header

## Current State
- Quick Queue is the primary/default tab (feature flag `QUICK_QUEUE_PRIMARY = true`)
- After adding episodes, a "Continue to Queue Tunes →" button navigates with episode count pre-filled
- `HIDE_PLAYED_EPISODES` flag exists but is OFF (requires `user-read-playback-position` scope which may cause auth errors)
- 126 Dependabot vulnerability warnings (pre-existing, not from recent changes)

## File Structure Highlights
- `src/featureFlags.ts` — All feature flags
- `src/Components/QuickQueue/` — QuickQueue.tsx (orchestrator), EpisodeCard, EpisodeList, QueueControls, DevicePickerModal, AddToQueueButton
- `src/Components/TabNav/TabNav.tsx` — Tab navigation between Quick Queue and Queue Tunes
- `src/Components/MainColumn/MainColumn.tsx` — Queue Tunes main component
- `src/Components/Step1/`, `Step2/`, `Step3/` — Queue Tunes step components
- `src/Services/` — All Spotify API service calls
- `src/Utils/Login.ts` — OAuth PKCE flow + token management
- `src/Utils/MergeQueueAndPlaylist.ts` — Interleaving logic
- `src/Utils/SkipTracksOnQueue.ts` — Sequential skip logic
- `src/Models/` — TypeScript interfaces (EpisodeWithShow, PlaylistInfo, QueueState, etc.)

---

## Future Plans

### Quick Wins
- **Real episode names in preview** — Show actual podcast episode titles (from queue state) instead of "Episode 1, 2, 3" in the Queue Tunes preview
- **Not enough songs warning** — If `playlist songs < episodes × ratio`, show yellow warning before queuing ("Only 8 songs available for 12 slots")
- **Browse own playlists** — Let logged-in users pick from their Spotify playlists (`GET /me/playlists`) instead of always pasting URLs

### Medium Effort
- **Recent playlists** — Remember last 5 playlists used. Show as quick-select chips below input
- **Saved presets** — Name and save a config (playlist + ratio + episodes + randomize). E.g., "Morning commute". One-tap to load and queue
- **Progress bar during queuing** — Show "Adding track 4/12..." instead of just a spinner (partially done in Quick Queue already)

### Bigger Features

#### Phase 8: Multiple Playlists (has detailed plan)
- Single text input at top, same as current
- When a valid playlist loads, it becomes a compact card/chip in a list below
- Input clears, ready for the next URL
- Each card shows: playlist name, song count, ✕ remove button
- Capped at 5 playlists max
- **Song selection:** Merge all tracks into one pool. If randomize is on, combined pool is shuffled together. If off, songs are in playlist order (first playlist first, etc.)
- **Implementation:** Replace single `playlistUrl`/`playlistInfo` with array, create PlaylistList component, concatenate all `tracks.items`, feed into existing pipeline

#### Other Big Features
- **Playlist search by name** — Type a name, show search results (`GET /search?type=playlist`)
- **Auto-queue on episode end** — Detect when queue runs out, re-queue automatically (polling or background tab)
- **Share config link** — Generate URL like `?playlist=abc&ratio=2&episodes=4` for sharing setups

### UX Polish
- **Animate preview on reshuffle** — Subtle fade/reorder animation
- **Confirm before re-queuing** — If songs are already interleaved, prevent accidental duplicates
- **Mobile responsive** — Optimize for phone (where people use Spotify most)

### Known Issues / Tech Debt
- `HIDE_PLAYED_EPISODES` feature flag exists but is disabled — enable once `user-read-playback-position` scope works in the Spotify Developer Dashboard
- 126 Dependabot vulnerability warnings on the repo (dependency updates needed)
- `frontend/build/` folder was previously tracked — now gitignored but old build artifacts may still be in git history

---

## Important Notes
- **Do not commit or push without user approval**
- The Spotify redirect URL in `public/env.js` must match what's registered in the Spotify Developer Dashboard
- `localhost` and `127.0.0.1` are different origins (separate localStorage) — currently set to `localhost:3000`
- Spotify's queue API (`POST /me/player/queue`) adds items to the top of "next up" in order
- Skip operations must be sequential (not parallel) due to Spotify's stateful queue — see `SkipTracksOnQueue.ts`
