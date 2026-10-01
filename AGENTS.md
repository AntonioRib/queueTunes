# QueueTunes coding guide

Keep this file, `CLAUDE.md`, and `.github/copilot-instructions.md` synchronized.

- Flow: pick episodes → pick songs → replace playback through Spotify Connect. Do not restore the retired tabs or queue-appending flow.
- Stack: React 18, TypeScript, Vite, Tailwind, Vitest; Express backend; Node 22.
- Setup and checks: [docs/runbook.md](docs/runbook.md). Use the tracked `.env.example` files; browser `VITE_*` values are public.
- Use `getValidAccessToken()` from `frontend/src/Utils/Login.ts` for user-authenticated services.
- Keep user-facing copy in `frontend/src/strings.ts` and frontend API bases in `frontend/src/config/endpoints.ts`.
- Prefer small components, `async/await`, typed data, and existing helpers. Avoid `any`, secret logging, and unrelated refactors.
- Comment only non-obvious logic; document exported APIs and external calls where usage or errors need explanation.
- Preserve accessibility, existing behavior, and license notices. Run relevant checks; regenerate notices after dependency changes.
- Work on main by default; use an existing isolated session worktree when provided. Do not create branches/worktrees or commit, push, publish, or deploy without approval.
- Agent-assisted commits include `Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>`.
