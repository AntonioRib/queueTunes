// episodeCache.js
// JSON-file-backed stale-while-revalidate cache for Spotify show episodes.
// Avoids native dependencies so it runs on any Node version Azure picks.
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const FRESH_TTL_MS = 60 * 60 * 1000;
const HARD_TTL_MS = 24 * 60 * 60 * 1000;

// Always fetch at least this many episodes so cache entries are reusable
// across requests that asked for fewer items.
const MIN_CACHE_LIMIT = 10;

// Cap how many Spotify calls we make concurrently from this process.
const MAX_CONCURRENT_FETCHES = 5;

const MAX_RETRIES = 3;

// Disk-flush is debounced so a burst of writes only produces one fsync.
const FLUSH_DEBOUNCE_MS = 500;

const resolveDataDir = () => {
  const primaryDir = "/home/data";
  const fallbackDir = path.resolve(__dirname, "data");
  try {
    fs.mkdirSync(primaryDir, { recursive: true });
    fs.accessSync(primaryDir, fs.constants.W_OK);
    return primaryDir;
  } catch (_err) {
    fs.mkdirSync(fallbackDir, { recursive: true });
    return fallbackDir;
  }
};

const dataDir = resolveDataDir();
const cachePath = path.join(dataDir, "episodes.json");
const tmpPath = `${cachePath}.tmp`;

// In-memory store: { [showId]: { limitUsed, episodes, fetchedAt } }
let store = {};

const loadFromDisk = () => {
  try {
    if (!fs.existsSync(cachePath)) return;
    const raw = fs.readFileSync(cachePath, "utf8");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      store = parsed;
    }
  } catch (err) {
    console.warn("Failed to load episode cache, starting empty:", err.message);
    store = {};
  }
};
loadFromDisk();

let flushTimer = null;
const flushSoon = () => {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    try {
      fs.writeFileSync(tmpPath, JSON.stringify(store));
      fs.renameSync(tmpPath, cachePath);
    } catch (err) {
      console.warn("Failed to flush episode cache:", err.message);
    }
  }, FLUSH_DEBOUNCE_MS);
};

const readCache = (showId) => store[showId] || null;

const writeCache = (showId, limitUsed, episodes) => {
  store[showId] = { limitUsed, episodes, fetchedAt: Date.now() };
  flushSoon();
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
  _cachePath: cachePath,
};
