// episodeCache.js
// SQLite-backed stale-while-revalidate cache for Spotify show episodes.
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const Database = require("better-sqlite3");

const FRESH_TTL_MS = 60 * 60 * 1000;
const HARD_TTL_MS = 24 * 60 * 60 * 1000;

// Always fetch at least this many episodes so cache entries are reusable
// across requests that asked for fewer items.
const MIN_CACHE_LIMIT = 10;

// Cap how many Spotify calls we make concurrently from this process.
const MAX_CONCURRENT_FETCHES = 5;

const MAX_RETRIES = 3;

const resolveDbPath = () => {
  const primaryDir = "/home/data";
  const fallbackDir = path.resolve(__dirname, "data");
  let dir = primaryDir;
  try {
    fs.mkdirSync(primaryDir, { recursive: true });
    // Probe writability — on local dev /home/data may exist but not be writable.
    fs.accessSync(primaryDir, fs.constants.W_OK);
  } catch (_err) {
    dir = fallbackDir;
    fs.mkdirSync(fallbackDir, { recursive: true });
  }
  return path.join(dir, "episodes.db");
};

const dbPath = resolveDbPath();
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS episodes (
    show_id TEXT PRIMARY KEY,
    limit_used INTEGER NOT NULL,
    episodes_json TEXT NOT NULL,
    fetched_at INTEGER NOT NULL
  );
`);

const selectStmt = db.prepare(
  "SELECT limit_used, episodes_json, fetched_at FROM episodes WHERE show_id = ?",
);
const upsertStmt = db.prepare(`
  INSERT INTO episodes (show_id, limit_used, episodes_json, fetched_at)
  VALUES (@show_id, @limit_used, @episodes_json, @fetched_at)
  ON CONFLICT(show_id) DO UPDATE SET
    limit_used = excluded.limit_used,
    episodes_json = excluded.episodes_json,
    fetched_at = excluded.fetched_at;
`);

const readCache = (showId) => {
  const row = selectStmt.get(showId);
  if (!row) return null;
  try {
    return {
      limitUsed: row.limit_used,
      episodes: JSON.parse(row.episodes_json),
      fetchedAt: row.fetched_at,
    };
  } catch (_err) {
    return null;
  }
};

const writeCache = (showId, limitUsed, episodes) => {
  upsertStmt.run({
    show_id: showId,
    limit_used: limitUsed,
    episodes_json: JSON.stringify(episodes),
    fetched_at: Date.now(),
  });
};

// Tiny semaphore so we never have more than MAX_CONCURRENT_FETCHES outbound
// Spotify requests in flight at the same time.
let active = 0;
const waiters = [];
const acquire = () =>
  new Promise((resolve) => {
    if (active < MAX_CONCURRENT_FETCHES) {
      active += 1;
      resolve();
    } else {
      waiters.push(resolve);
    }
  });
const release = () => {
  const next = waiters.shift();
  if (next) {
    next();
  } else {
    active -= 1;
  }
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const fetchFromSpotify = async (showId, limit, getToken) => {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const token = await getToken();
    if (!token) throw new Error("No Spotify token available");
    try {
      const response = await axios.get(
        `https://api.spotify.com/v1/shows/${showId}/episodes`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit },
        },
      );
      return response.data.items || [];
    } catch (err) {
      const status = err.response?.status;
      if (status === 429 && attempt < MAX_RETRIES - 1) {
        const retryAfter = Number(err.response.headers["retry-after"] || 2);
        await sleep(retryAfter * 1000);
        continue;
      }
      throw err;
    }
  }
  return [];
};

// Coalesce concurrent refreshes for the same show.
const inFlight = new Map();

const refreshShow = (showId, limit, getToken) => {
  const existing = inFlight.get(showId);
  if (existing) return existing;

  const promise = (async () => {
    await acquire();
    try {
      const episodes = await fetchFromSpotify(showId, limit, getToken);
      writeCache(showId, limit, episodes);
      return episodes;
    } finally {
      release();
      inFlight.delete(showId);
    }
  })();

  inFlight.set(showId, promise);
  return promise;
};

const sliceEpisodes = (episodes, limit) =>
  Array.isArray(episodes) ? episodes.slice(0, limit) : [];

// Resolve one show:
//  - fresh cache (age < FRESH_TTL): serve cache
//  - stale-but-warm (FRESH_TTL <= age < HARD_TTL): serve cache, refresh in bg
//  - expired / missing / limit-too-small: block on a refresh; fall back to
//    stale cache on failure if we have any.
const resolveShow = async (showId, requestedLimit, getToken) => {
  const fetchLimit = Math.max(requestedLimit, MIN_CACHE_LIMIT);
  const cached = readCache(showId);
  const now = Date.now();

  if (cached && cached.limitUsed >= requestedLimit) {
    const age = now - cached.fetchedAt;
    if (age < FRESH_TTL_MS) {
      return sliceEpisodes(cached.episodes, requestedLimit);
    }
    if (age < HARD_TTL_MS) {
      // Stale-while-revalidate: serve immediately, refresh in background.
      refreshShow(showId, fetchLimit, getToken).catch((err) => {
        console.warn(
          `Background refresh failed for show ${showId}:`,
          err.message || err,
        );
      });
      return sliceEpisodes(cached.episodes, requestedLimit);
    }
  }

  try {
    const episodes = await refreshShow(showId, fetchLimit, getToken);
    return sliceEpisodes(episodes, requestedLimit);
  } catch (err) {
    if (cached) {
      console.warn(
        `Spotify fetch failed for show ${showId}; serving stale cache:`,
        err.message || err,
      );
      return sliceEpisodes(cached.episodes, requestedLimit);
    }
    throw err;
  }
};

const getEpisodesForShows = async (showIds, limit, getToken) => {
  const result = {};
  const settlements = await Promise.allSettled(
    showIds.map((id) => resolveShow(id, limit, getToken)),
  );
  settlements.forEach((s, idx) => {
    const id = showIds[idx];
    if (s.status === "fulfilled") {
      result[id] = s.value;
    } else {
      console.warn(
        `No episodes available for show ${id}:`,
        s.reason?.message || s.reason,
      );
      result[id] = [];
    }
  });
  return result;
};

module.exports = {
  getEpisodesForShows,
  _dbPath: dbPath,
};
