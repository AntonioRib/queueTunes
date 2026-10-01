> Mirror of AGENTS.md. Edit AGENTS.md and copy the changes here.


> Canonical context file for any coding agent (Copilot, Claude, Cursor, Codex, etc.).
> `CLAUDE.md` and `.github/copilot-instructions.md` are mirrors of this file.

## What QueueTunes is

QueueTunes is a solo-owner web app that interleaves the user's Spotify podcast episodes with music, then plays the merged sequence via Spotify Connect. It runs as a React 18 + TypeScript frontend and a small Express backend that fronts a Spotify episode cache and a playlist proxy.

## Current mental model — read this first

The app uses a **single wizard** flow:

1. **Step 1 — pick episodes** (checkable list of recent episodes from followed shows).
2. **Step 2 — pick songs** (source: My songs / Playlist URL; fine-tune: songs-per-episode, randomize).
3. **Play now** — one atomic `PUT /v1/me/player/play` that replaces the queue with `Ep1 → S… → Ep2 → S… → …`.

The **retired** model (do not build against it) had two separate tabs — "Quick Queue" (episode bulk-add) and "Queue Tunes" (URL-paste interleave) — plus a handoff button between them. Any reference to `QUICK_QUEUE_PRIMARY`, `TabNav`, `Step1/Step2/Step3`, `MainColumn`, `AddToSpotifyQueue`, `SkipTracksOnQueue`, or `GetSpotifyQueueState` is legacy and will be removed by the v2 rewrite. The authoritative description of the new flow lives in `docs/specs/queue-tunes-v2.md`.

## Tech stack

- **Frontend:** React 18 + TypeScript + Tailwind CSS, built with Vite; tests use Vitest. Use Node.js 22 LTS for local development and CI.
- **Routing:** `react-router-dom` v7 (BrowserRouter). The v2 wizard collapses routing to a single `/` plus the OAuth callback.
- **Auth:** Spotify OAuth PKCE. `Utils/Login.ts::getValidAccessToken()` auto-refreshes tokens; every service goes through it.
- **Backend:** Express. A `POST /api/shows/episodes` batch endpoint uses a JSON-file-backed SWR cache; `GET /api/playlist/:id` uses a client-credentials app token. The legacy `/api/token` endpoint also remains.
- **Environment:** Vite embeds `VITE_*` variables at build time. Copy `frontend/.env.example` to `.env.local`; keep secrets out of browser configuration. Backend uses a plain `.env` with a tracked `.env.example`.

## Running locally

Two processes, run in separate terminals:

```bash
# Frontend (port 3000)
cd frontend && npm start

# Backend (port 5333)
cd backend && npm start
```

Required env vars:

- `frontend/.env.local`: `VITE_SPOTIFY_CLIENT_ID`, `VITE_SPOTIFY_REDIRECT_URL`, `VITE_SPOTIFY_AUTH_URL`, `VITE_BACKEND_URL`. Feature flags live in `src/featureFlags.ts`.
- `backend/.env`: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `ALLOWED_ORIGINS` (CSV), `PORT` (default `5333`).

Full setup, deploy notes, and common gotchas: `docs/runbook.md`.

## Style rules (short form)

Full version + examples: `docs/style.md`.

- **Comments:** only when the code needs clarification. One line where possible; explain WHY, not what. No narrating obvious code.
- **Docblocks:** every exported function, hook, method, or module-level const gets JSDoc/TSDoc with `@param`, `@returns`, `@throws`, and `@example` when the usage isn't obvious. Same for anything hitting an external API — document the endpoint, response shape, and known error modes.
- **Code:** prefer `async/await`; avoid `any` (use `unknown` and narrow); never log tokens, secrets, or full user payloads; keep components small (~200 lines is the smell threshold); one default export per file when it makes sense.
- **Tailwind:** `prettier-plugin-tailwindcss` is installed — let it order classes (layout → spacing → typography → color → state).

## Repo conventions

- **Work on `main` in the main checkout by default.** Do not create worktrees, branches, or PRs unless the user explicitly asks.
- **No commits or pushes without explicit user approval.** Even on a solo repo. Report a diff summary and wait.
- Every agent-assisted commit includes the trailer:
  ```
  Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
  ```
- Small, focused commits > big-bang commits.
- `localhost` and `127.0.0.1` are different origins (different localStorage). Use `http://127.0.0.1:3000` locally; Spotify does not accept `localhost` redirect URIs. The redirect URL must match the Spotify Developer Dashboard exactly.

## Where to look next

- `docs/agents/` — role-specific system prompts (PM, frontend, backend, code reviewer, UX writer). Paste one when spawning a role-scoped session.
- `docs/specs/queue-tunes-v2.md` — the approved rewrite spec.
- `docs/style.md` — full style guide with examples.
- `docs/glossary.md` — terminology (including retired names).
- `docs/runbook.md` — install, env, run, deploy, common issues.
- `docs/decisions/` — ADRs. Starts blank; use `0000-template.md` for new entries.
