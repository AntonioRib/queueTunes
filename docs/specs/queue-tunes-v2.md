Status: approved, implementation pending (see todo v2-experience-rewrite).

# QueueTunes v2 — Experience Spec

> Written from the user's point of view first. Implementation notes are at the bottom.

## The user

Solo. Owner of the app. Uses it on their phone during commutes / walks. Wants "podcasts, with music between them, right now" without fiddling. Trusts sensible defaults but wants a hatch for tuning.

## The hero flow (single mental model)

The app has **one experience**, presented as two questions:

**Step 1 — "Which podcasts do you want?"**
- Landing state. App shows a checkable list of recent episodes from the podcasts the user follows on Spotify.
- Filter chip at the top: `Today · Last 3 days · Last 7 days` (defaults to Last 3 days, remembered).
- Each row: show art, show name, episode title, relative day ("Today", "Yesterday", "Monday"), duration, checkbox.
- Bottom action: **"Next → Pick songs"**. Disabled until at least one episode is checked.
- Auth: if the user isn't logged in, this screen shows "Log in with Spotify" instead.

**Step 2 — "Which songs do you want between them?"**
- Song source selector at the top. v1 options:
  - **My songs** (default) — random slice of the user's saved tracks
  - **Playlist URL** — paste field, validates on paste
- A collapsed "Fine-tune" section (chevron / disclosure). Collapsed by default.
  - Songs per episode (slider, 1–5, default 2)
  - Randomize song order (checkbox, default on)
- Bottom action: **"Play now"**.

**What "Play now" does (the promise):**

> Your Spotify starts playing:
> `Ep1 → S1 → S2 → Ep2 → S3 → S4 → … → EpN → S(2N-1) → S(2N)`
> Nothing else. Whatever you were listening to is gone.

- Confirmation modal on the very first tap ever: *"This will replace what's currently playing on Spotify. Continue?"* with a "Don't ask again" checkbox. After that, no confirmation.
- If no active Spotify device, the device picker opens; user picks a device; the flow continues automatically.
- While the API calls happen, a full-screen progress state: *"Building your queue…"* with a spinner and a "Cancel" button.
- On success, the app switches to a **"Now playing"** confirmation view showing the plan (Ep1 → S1 → S2 → Ep2 → …) with a "Start over" button that returns to Step 1.

## Idempotency & re-taps

- The "Play now" button is disabled for 5 seconds after tap.
- If the user returns to Step 2 within 30 seconds of a successful play and re-taps, show: *"You just built this queue 12s ago. Play again?"* with Yes / No.

## What's explicitly removed vs today

- ❌ The "Queue Tunes" URL flow as a standalone tab.
- ❌ The "Quick Queue" as a standalone tab.
- ❌ The Continue-to-Queue-Tunes handoff — it's now one flow, no handoff needed.
- ❌ The episode count slider — auto-detected from what the user checks in Step 1.
- ❌ The "append to queue" model — every play is a fresh replacement.
- ❌ The `?episodes=` URL param — no longer relevant.
- ❌ The routing between `/` and `/queue-tunes` — one route.

## What stays

- Spotify PKCE login.
- The backend episode cache (todo #40, in review).
- The build-time `HIDE_PLAYED_EPISODES` flag (surfaces once the scope is approved).
- The saved playlist URL feature (as a song source option in Step 2).

## Behavior details

### Step 1 — Episode selection
1. On mount, fetch episodes via the new `POST /api/shows/episodes` (todo #40).
2. If cached in localStorage and fresh (1h), render immediately; kick off a background refresh.
3. Sort by release date descending. Group under "Today", "Yesterday", weekday name.
4. "Refresh" button (icon) forces a re-fetch (bypasses localStorage).
5. `HIDE_PLAYED_EPISODES` (when scope is available) filters out finished episodes at render time.

### Step 2 — Song source & tuning
1. Song source default: **My songs**.
2. **My songs mode:**
   - Fetch total saved tracks via `GET /me/tracks?limit=1`.
   - Pick a random offset in `[0, total - 50]`, fetch 50 tracks from there.
   - If randomize is on (default), Fisher-Yates the 50.
   - Use as many as needed (episodes × songs-per-episode).
   - If total < needed, fall back to whatever we have and warn.
3. **Playlist URL mode:**
   - Validate on paste (existing `ValidatePlaylistUrl`).
   - Fetch via backend proxy (`/api/playlist/:id`).
   - Show a preview card: playlist name, song count.
   - If randomize is on, Fisher-Yates the tracks.
   - Warn if track count < needed slots.

### Play now
1. Check for active device. If none: open device picker; on select, `PUT /me/player` to transfer + wait 1s.
2. Build the merge list:
   ```
   for each checked episode E in Step-1 order:
     merge.push(E.uri)
     for i in 1..songsPerEpisode:
       merge.push(nextSongUri())
   ```
3. Single call: `PUT /v1/me/player/play` with `{ uris: merge }`. This atomically replaces the queue.
4. No skipping. No appending. No queue-state reading. Done.
5. Failure: show a toast with the Spotify error; the "Play now" button re-enables.

### Cancellation
- The "Cancel" button in the building state simply aborts the in-flight request. Since the flow is now a single API call, cancel = no side effects (except maybe device transfer, which we accept).

### Empty / error states
- No followed shows: *"You don't follow any podcasts on Spotify yet."* + link to Spotify.
- No episodes in the lookback window: *"No new episodes in the last N days"* + widen-lookback chip.
- Spotify API failure: *"Spotify couldn't do that right now. Try again?"* with retry.
- No active device after picker: same error, retry.

## Implementation notes

### API surface
- Reads:
  - `GET /v1/me/shows` (list)
  - `POST /api/shows/episodes` (batch, backend cache)
  - `GET /v1/me/tracks?limit=1` (for total) + `GET /v1/me/tracks?offset=X&limit=50`
  - `GET /api/playlist/:id` (backend proxy)
  - `GET /v1/me/player/devices` (for picker)
- Writes:
  - `PUT /v1/me/player` (transfer device — only if picker used)
  - `PUT /v1/me/player/play` (with `uris` — **the only write in the hot path**)

### Files that go away (or shrink to zero use)
- `Utils/SkipTracksOnQueue.ts` — no more skipping.
- `Utils/AddTracksToQueue.ts` — no more per-track appending.
- `Services/AddToSpotifyQueue.ts` — replaced by a single `PlayUris(uris)`.
- `Services/GetSpotifyQueueState.ts` — no more queue introspection.
- `Services/SkipToNext.ts` — unused.
- `Services/PausePlayback.ts` — unused.
- `Utils/MergeQueueAndPlaylist.ts` — replaced by a much simpler `buildMerge(episodes, songs, ratio)` that doesn't touch the queue.
- `Components/MainColumn/`, `Step1/`, `Step2/`, `Step3/`, `TabNav/`, `RandomizeCheckbox/`, `RatioSlider/`, `EpisodeSlider/`, `SourceChoice/`, `QueuePreview/`, `PlaylistViewer/` — replaced by two new screens.

### New files
- `Services/PlayUris.ts` — `PUT /v1/me/player/play` wrapper.
- `Services/GetMySongsRandom.ts` — total-then-random-offset saved-tracks fetch.
- `Utils/buildMerge.ts` — pure function, easy to unit test.
- `Components/Wizard/Wizard.tsx` — root of the new flow (holds state across the two steps).
- `Components/Wizard/EpisodePickerStep.tsx` — Step 1.
- `Components/Wizard/SongSourceStep.tsx` — Step 2.
- `Components/Wizard/PlayNowConfirm.tsx` — first-tap confirmation modal.
- `Components/Wizard/BuildingState.tsx` — the "Building your queue…" screen.
- `Components/Wizard/NowPlayingSummary.tsx` — post-play summary.

### State ownership
Wizard component owns a `WizardState`:
```ts
type WizardState = {
  step: 'pick-episodes' | 'pick-songs' | 'confirm' | 'building' | 'done' | 'error';
  selectedEpisodes: EpisodeWithShow[];
  songSource: { kind: 'my-songs' } | { kind: 'playlist'; url: string; info?: PlaylistInfo };
  songsPerEpisode: number;   // default 2
  randomize: boolean;         // default true
  lookbackDays: 1 | 3 | 7;    // persisted
  error?: string;
};
```

### Retiring feature flags & routes
- Delete `featureFlags.QUICK_QUEUE_PRIMARY` (no more tabs).
- Keep `HIDE_PLAYED_EPISODES` and `ENABLE_DEVICE_PICKER` (both still meaningful; picker is now always used).
- Delete `<TabNav>`.
- App has a single route `/` and a callback route for OAuth (unchanged).

### Backlog impact
Retired by this spec:
- #10 wire-device-picker-mainColumn (built in)
- #11 disable-step3-no-episodes (button is disabled by state, not a Step 3 anymore)
- #12 preview-real-episode-names (the summary already shows real episodes)
- #13 not-enough-songs-warning (built in)
- #15 auto-detect-episode-count (built in)
- #16 improve-use-my-songs (built in via random-offset)
- #17 tune-skip-delay (no skipping)
- #18 reevaluate-skip-hack (no more hack)
- #6 fix-shuffle-bias (Fisher-Yates in `buildMerge`)
- #7 surface-queue-failures (one call; success is boolean-obvious)
- #8 fix-error-querystring-check (routes rewritten)
- #19 queue-progress-bar (replaced by BuildingState)
- #27 confirm-before-requeue (built in via cooldown + 30s warning)

Still relevant, unchanged:
- #40 backend-episode-cache (already in progress)
- #41 played-episodes-toggle (still needs resume_point enrichment)
- #14 browse-own-playlists (blocked on scope)
- #22 multiple-playlists-phase8 (post-v2)
- Architecture items #29–#34
- CI/tests items #35–#39

### Rollout plan
This is a rewrite. Do it on a branch, ship it in one release. There are no other users to phase; the app is solo.

Order of work:
1. **Land #40** (backend episode cache) — already implemented; awaiting review/commit.
2. **New wizard scaffold** — Wizard.tsx + routing collapse + delete TabNav.
3. **EpisodePickerStep** — reuses the Quick Queue episode fetching logic against the new endpoint.
4. **SongSourceStep** — playlist URL + My Songs random-offset.
5. **PlayNowConfirm + BuildingState + NowPlayingSummary** — the "commit" flow, wired to `PlayUris`.
6. **Delete obsolete files** listed above.
7. **Manual smoke test** — real device, real Spotify, real podcast.
8. **Ship**, then attack #41 with the freed mental space.
