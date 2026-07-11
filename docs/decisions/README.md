# Architecture Decision Records

This folder records deliberate, non-obvious decisions worth remembering: architecture choices, tech swaps, explicit non-goals, and anything future-you would ask "why did we do this?" about.

## Format

Each ADR is a single markdown file named `NNNN-kebab-case-title.md`, where `NNNN` is a zero-padded, monotonically increasing number.

Use [`0000-template.md`](./0000-template.md) as the starting point — copy it, renumber it, fill it in.

## Numbering

- `0000-template.md` is reserved for the template.
- The first real ADR is `0001`. Increment from there. Never reuse a number.
- If a decision is later reversed or replaced, don't delete the old ADR — add a new one that supersedes it and update the old one's status.

## Statuses

- **Proposed** — under discussion.
- **Accepted** — active decision.
- **Superseded by NNNN** — replaced by a later ADR; keep the file for history.
- **Rejected** — considered and declined; kept so we don't relitigate.

## Blank canvas

Past decisions live in git history, not here. ADRs start fresh from the next big decision. Don't backfill.
