# Style & Documentation

Rules for code, comments, docblocks, and git in this repo. Every rule has a reason. Prefer the tool doing it (Prettier, TypeScript, `prettier-plugin-tailwindcss`) over doing it by hand.

## Comments

- Only comment code that needs a bit of clarification: weird logic, non-obvious workarounds, tricky invariants.
- Short — one line where possible; two or three max.
- Explain **WHY**, not what. If the "what" is unclear, rename or refactor first.
- Do not narrate what the code obviously does.

Bad:
```ts
// increment counter
count += 1;
```

Good:
```ts
// Spotify returns 429 without Retry-After when we hit their internal rate cap; wait 2s.
await sleep(2000);
```

## Docblocks (exported symbols and API touchpoints)

Every symbol that leaves a file (imported by another file or another module) MUST have a JSDoc/TSDoc block:

- One-line summary.
- `@param` for every parameter (with type if not fully inferable from TypeScript).
- `@returns` describing shape and edge cases (e.g. `null` if not found, empty array on miss).
- `@throws` for any error it can raise.
- `@example` when the usage isn't obvious.

Same rules apply to:

- **External API callers** (Spotify, our own `/api/*`): document the endpoint hit, the expected response shape, and the known error modes (401 → refresh, 429 → Retry-After, 404 → treat as empty, etc.).
- **Exported module-level variables** (constants, env keys, feature flags): a short block explaining what they mean and what changes when they change.

Example:
```ts
/**
 * Play the given track URIs immediately, replacing whatever the user was hearing.
 * Wraps `PUT /v1/me/player/play` with `{ uris }`.
 *
 * @param uris - Spotify track/episode URIs, in play order.
 * @param deviceId - Optional target device; omitted uses the active device.
 * @returns Resolves when Spotify accepts the request (HTTP 204).
 * @throws SpotifyApiError on 4xx/5xx. Callers should surface `error.message` in a toast.
 * @example
 *   await playUris(['spotify:episode:abc', 'spotify:track:xyz']);
 */
export async function playUris(uris: string[], deviceId?: string): Promise<void> { … }
```

## Code style

- Prefer `async/await` over `.then().catch()` in the same function. Reason: it composes with `try/catch`, error handling stays linear.
- Avoid `any`. Use `unknown` when the shape truly isn't known, then narrow with a type guard. Reason: `any` disables the compiler; `unknown` forces you to think.
- Never `console.log` tokens, secrets, or full user payloads. Reason: dev tools leak; shared screens leak. `console.warn` / `console.error` for actual errors are fine.
- Keep components small. If a component file crosses **~200 lines**, look for a split. Reason: 200 lines is where testability and readability drop off.
- **Tailwind class order:** layout → spacing → typography → color → state. Let `prettier-plugin-tailwindcss` (already installed) do this automatically.
- One default export per file when it makes sense, otherwise named exports. Reason: named exports make IDE rename + auto-import unambiguous.

## Git

- **No commits or pushes without explicit user approval.**
- Every agent-assisted commit includes:
  ```
  Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
  ```
- Small, focused commits > big-bang commits. Prefer one commit per logical change.
