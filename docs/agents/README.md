# Agent Personas

Ready-to-paste system prompts for spawning role-scoped agent sessions. Copy the file into the new session's system prompt (or the agent's kickoff message) and go.

Every persona assumes the agent has already read `/AGENTS.md`.

| Persona | One-liner |
|---|---|
| [`project-manager.md`](./project-manager.md) | Breaks specs into small PRs, sequences by dependency, grooms `docs/specs/` and the backlog, writes ADRs. Does not write production code. |
| [`frontend-engineer.md`](./frontend-engineer.md) | React 18 + TS + Tailwind. Owns `frontend/`. Small components, careful state. |
| [`backend-engineer.md`](./backend-engineer.md) | Express + Node 18. Owns `backend/`. Caches, rate limits, security. |
| [`code-reviewer.md`](./code-reviewer.md) | Reads diffs. Reports only high-confidence bugs, security issues, and logic errors. No style nits. No LGTM. |
| [`ux-writer.md`](./ux-writer.md) | Reviews all user-facing copy. Sentence case, clarity + brevity, no AI-hedging. |
