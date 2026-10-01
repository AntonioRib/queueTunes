# Runbook

## Prerequisites and configuration

Use **Node.js 22 LTS** and npm. Node 18 is not supported by the locked Vitest 4 and React Router 7 versions.

Create your own Spotify Developer app. Register `http://127.0.0.1:3000` as its redirect URI, matching the frontend configuration exactly. Spotify permits HTTP for explicit loopback IPs, not `localhost`; production redirects must use HTTPS. See [Spotify redirect URI requirements](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri).

From the repository root:

```bash
npm --prefix frontend ci
npm --prefix backend ci
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

Set the following locally; do not commit filled configuration:

| File | Variables |
| --- | --- |
| `frontend/.env.local` | `VITE_SPOTIFY_CLIENT_ID`, `VITE_SPOTIFY_REDIRECT_URL`, `VITE_SPOTIFY_AUTH_URL`, `VITE_BACKEND_URL` |
| `backend/.env` | `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `ALLOWED_ORIGINS`, `PORT` |

The frontend and backend should use your own app's client ID. A client ID is public configuration, not a secret. **All `VITE_*` values are embedded at build time and visible to visitors**; never include credentials other than the public client ID. The backend client secret stays server-side. The previous `react-dotenv` / `public/env.js` setup is obsolete.

`ALLOWED_ORIGINS` is a comma-separated frontend-origin allowlist; production must include the deployed frontend origin. CORS is a browser policy, not authentication. `PORT` defaults to `5333`. Development also permits the loopback origins listed in `backend/server.js`.

## Run and check

Run these in separate terminals:

```bash
# Frontend: http://127.0.0.1:3000
cd frontend && npm start

# Backend: http://127.0.0.1:5333
cd backend && npm start
```

If port 3000 is occupied, stop the conflicting process you own or configure/register the chosen port consistently; Vite may choose another port.

From the repository root:

```bash
npm --prefix frontend run lint
npm --prefix frontend test
npm --prefix frontend run build
node --check backend/server.js
node --check backend/episodeCache.js
node --test scripts/release-readiness.test.mjs
node scripts/generate-third-party-notices.mjs --check
npm --prefix frontend audit
npm --prefix backend audit
```

There is no configured backend automated test suite. Its `lint` script does not supply an installed ESLint/configuration; use the syntax checks above rather than treating that script as a passing lint gate.

## Sign-in and playback

The `/` route displays a Spotify login prompt when no valid user token is available. Login uses Authorization Code with PKCE; the callback returns to the same route. Tokens are kept in browser storage, and the app requests library-read and playback-read/write permissions (plus playback position when the relevant feature flag is enabled).

After login, select episodes from followed shows, continue to song selection, choose saved songs or a playlist URL, and confirm Play now. Playback uses Spotify Connect, not an embedded audio player, and replaces the current playback sequence. Open Spotify on a device first. Do not test this flow against someone else's account or queue.

## Spotify access and public release gates

**Publishing source and operating an unrestricted Spotify app are separate decisions.** Forks must supply their own credentials. The hosted app is not an anonymous demo.

As checked October 1, 2026, Spotify's [Development Mode announcement](https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security) specifies Premium, a limit of five authorized users, and one Development Mode client ID per developer. Its March 9 addendum postpones endpoint changes for existing integrations, not those account/access requirements. The actual deployed app's quota mode, allowlist, and any grandfathering must be checked by its owner in the Developer Dashboard; this review did not access it. Do not promise access to arbitrary visitors.

Spotify's [February 2026 API changelog](https://developer.spotify.com/documentation/web-api/references/changes/february-2026) changes playlist response shapes (`tracks` to `items`) and restricts playlist contents to the user's playlists under the new rules. QueueTunes currently proxies playlists using a client-credentials token and expects the older shape. **Playlist URL compatibility for a newly created Spotify app is unverified and may be blocked by these restrictions.** Do not silently treat it as supported, or migrate the deployed integration without confirming which rules apply.

Playback requires Premium per the [Start/Resume Playback API](https://developer.spotify.com/documentation/web-api/reference/start-a-users-playback), plus an available compatible device. Source release does not remove Spotify's platform terms, rate limits, or access approval requirements.

The [hosted app](https://happy-ground-0d8a70103.4.azurestaticapps.net/) returned HTTP 200 for its HTML and served its referenced JavaScript on October 1, 2026. The bundle contains login and playback UI. This establishes unauthenticated asset availability, **not** working OAuth, a rendered browser flow, backend health, or playback. Link it only as **"Hosted app - Spotify sign-in and approved access required"**, not "Try a public demo".

Before source publication, the owner must:

- Approve the visibility change separately; keep the repository private until then.
- Preserve the root ISC license and the backend's matching declaration. Third-party code and content are not relicensed by the project license.
- Review historical icon provenance if publishing full history. The current tree removes the unused Noto-style `logo.svg` and old `favicon.ico`, replacing them with an original geometric SVG under ISC. Those old files remain in historical commits; no history was rewritten.
- Retain the generated runtime license notices in frontend/backend distributions. The generator copies installed license/notice texts (or README license sections) and fails when a package lacks one. `react-secure-storage@1.3.2` omits its MIT license text; the upstream notice and retrieval provenance are preserved in `licenses/`. This is not a legal opinion or a license review of all build/test tools.
- Approve exposing git author names/emails and deployment identifiers. Review remote-only refs, releases, Actions logs/artifacts, and untracked deployment configuration separately.
- Configure GitHub environment approvals/branch restrictions and verify the Azure runtime before any later deployment. The October 1 read-only settings check found the `Production` environment had **no protection rules and no deployment branch policy**. Workflow guards are not a substitute for these settings.

No confirmed live credential was identified by the local preparation scan. If a later scan finds one, the owner must revoke/rotate it and separately approve history cleanup **before** publication; deleting a current file is insufficient.

The initial local pattern scan covered 191 reachable commits and 416 unique file blobs. A follow-up used checksum-verified **Gitleaks 8.30.1**, with fully redacted reports stored outside the repository: `gitleaks git . --log-opts="--all --full-history -m" --redact=100`, a separate scan of `git log --all --format=fuller`, and a directory scan of the publication tree (tracked files plus nonignored additions, excluding deleted files). All reported no leaks. At follow-up, available refs contained 194 commits; Gitleaks reported 127 scanned commits with patch content, including merge diffs (6.46 MB), not 194 individual file snapshots. No refs were fetched by this session. Shared repository refs can change, so rerun before publication.

Two non-noreply author email addresses remain in git metadata (values intentionally omitted). This scan is not proof that secrets never existed: unreachable objects, remote-only refs, external logs/artifacts, ignored local files, and credential validity were not covered. Nothing was uploaded to a scanning service, rotated, or removed from history.

Runtime notices cover 42 frontend and 92 backend package entries, conservatively including production packages not necessarily bundled by Vite. They are available at `frontend/public/third-party-notices.txt` (copied into the frontend build) and `backend/THIRD_PARTY_NOTICES.txt` (included in the deploy archive). Run `node scripts/generate-third-party-notices.mjs` after dependency changes; CI checks that notices are current. Build/test dependencies remain subject to their own licenses, including CC-BY-4.0 (`caniuse-lite`), Python-2.0 (`argparse`), and BlueOak-1.0.0 (`minimatch`); do not redistribute development `node_modules` without their notices.

The follow-up October 1, 2026 audit reports **zero known advisories in both projects**, including development dependencies, after targeted compatible updates. Axios is at 1.20.0, React Router DOM at 7.18.4, Vitest/coverage at 4.1.11, PostCSS at 8.5.28, Express at 4.22.3, and qs at 6.16.0. Lockfiles also update affected transitive dependencies. No force or major-version upgrade was used. Audits are time-sensitive and do not prove absence of application-level vulnerabilities.

## Deploy and troubleshoot

The workflows target Azure Static Web Apps (frontend) and Azure App Service (backend). They are not generic fork deployment recipes: supply your own Azure resources, Actions variables, credentials, and environment approvals. Deployment was not run during source preparation. Both build workflows and package manifests now use Node 22; **the live Azure App Service runtime still requires an owner check/update**. No Azure configuration was read or changed.

Automatic deployments accept only successful CI runs originating from a push to this repository's `main`, and check out that exact tested SHA with persisted git credentials disabled. Frontend PR preview deployments are intentionally disabled; PRs run CI only. Frontend deployment uploads a Node-22-prebuilt bundle (including the SPA routing config) and no longer requests an OIDC token. Both production deployments use the `Production` environment; backend manual dispatch is restricted to `main`. Manual backend deployment remains an explicit operator override, with syntax checks but not a full CI rerun. Only the backend deploy job receives Azure OIDC permission.

Vite builds into `frontend/build/`. Set the four `VITE_*` Actions variables before building; changing server-side settings after a build does not change the browser bundle. Backend settings belong in App Service configuration. Keep local episode caches (`backend/data/`) and scratch data out of source control.

- **Redirect mismatch:** use the exact registered URI and the same browser origin throughout sign-in; `localhost` and `127.0.0.1` have separate storage.
- **New scopes:** sign in again to grant changed permissions.
- **403 / unavailable features:** check app access, Premium, and endpoint restrictions before assuming a code defect.
- **429:** respect Spotify's `Retry-After`; retry handling varies by service, so avoid repeated manual refreshes.
- **CORS:** check `ALLOWED_ORIGINS` against the exact frontend origin.
- **Slow first load:** Azure cold starts can delay the episode batch endpoint.
