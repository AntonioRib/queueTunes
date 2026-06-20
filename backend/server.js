// server.js
const express = require("express");
const axios = require("axios");
const qs = require("qs");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { LocalStorage } = require("node-localstorage");
require("dotenv").config();
const episodeCache = require("./episodeCache");

const app = express();
const port = process.env.PORT || 5333;

app.use(express.json({ limit: "100kb" }));

// Spotify Client Credentials
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

const DEV_ORIGINS = ["http://localhost:3000", "http://localhost:5173"];
const configuredOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const allowedOrigins = new Set([
  ...configuredOrigins,
  ...(process.env.NODE_ENV === "production" ? [] : DEV_ORIGINS),
]);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (curl, server-to-server) which send no Origin header
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      // Disallowed: omit CORS headers so the browser blocks it, without
      // throwing (which would leak a stack trace via the default error handler).
      return callback(null, false);
    },
  }),
);

const tokenLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many token requests, please try again later." },
});

const playlistLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many playlist requests, please try again later." },
});

// One frontend QuickQueue refresh maps to a single call on this endpoint
// regardless of how many shows the user follows, so 60/min/IP is plenty.
const episodesLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many episode requests, please try again later." },
});

const localStorage = new LocalStorage("./scratch");

// Function to get the Spotify Access Token
const getSpotifyToken = async () => {
  const tokenUrl = "https://accounts.spotify.com/api/token";

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const data = qs.stringify({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  try {
    const response = await axios.post(tokenUrl, data, { headers });
    const expirationTime = Date.now() + response.data.expires_in * 1000;
    response.data.expiration_time = expirationTime;
    localStorage.setItem("SPOTIFY_TOKEN", JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.error("Error getting access token", error);
    return null;
  }
};

const getCachedToken = () => {
  const token = localStorage.getItem("SPOTIFY_TOKEN");
  if (!token) return null;
  const savedToken = JSON.parse(token);
  if (
    savedToken &&
    savedToken.expiration_time > Date.now() &&
    savedToken.access_token
  ) {
    return savedToken;
  }

  return null;
};

// Endpoint to get the access token
app.get("/api/token", tokenLimiter, async (req, res) => {
  const savedToken = getCachedToken();
  if (savedToken) {
    return res.json({
      access_token: savedToken.access_token,
      expiration_time: savedToken.expiration_time,
    });
  }

  const token = await getSpotifyToken();
  if (token) {
    return res.json({
      access_token: token.access_token,
      expiration_time: token.expiration_time,
    });
  } else {
    return res.status(500).json({ error: "Failed to get token" });
  }
});

app.get("/", (req, res) => {
  return res.send("Hello World!");
});

// Fallback: scrape playlist data from Spotify's embed page (works for editorial playlists)
const getPlaylistFromEmbed = async (playlistId) => {
  const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;
  const response = await axios.get(embedUrl);
  const match = response.data.match(/__NEXT_DATA__.*?>(.*?)<\/script>/);
  if (!match) return null;

  const data = JSON.parse(match[1]);
  const entity = data.props?.pageProps?.state?.data?.entity;
  if (!entity || !entity.trackList) return null;

  // Transform to match Spotify API playlist format
  return {
    name: entity.name,
    id: playlistId,
    uri: entity.uri,
    type: "playlist",
    tracks: {
      total: entity.trackList.length,
      totalIsApproximate: entity.trackList.length >= 100,
      items: entity.trackList.map((t) => ({
        track: {
          name: t.title,
          uri: t.uri,
          artists: [{ name: t.subtitle }],
          duration_ms: t.duration,
        },
      })),
    },
    followers: { total: 0 },
    owner: { display_name: "Spotify" },
  };
};

// Endpoint to get playlist info via backend token
app.get("/api/playlist/:id", playlistLimiter, async (req, res) => {
  const playlistId = req.params.id;
  if (!playlistId || !/^[a-zA-Z0-9]+$/.test(playlistId)) {
    return res.status(400).json({ error: "Invalid playlist ID" });
  }

  let savedToken = getCachedToken();
  if (!savedToken) {
    savedToken = await getSpotifyToken();
  }

  if (!savedToken || !savedToken.access_token) {
    return res.status(500).json({ error: "Failed to get Spotify token" });
  }

  try {
    const response = await axios.get(
      `https://api.spotify.com/v1/playlists/${playlistId}`,
      {
        headers: { Authorization: `Bearer ${savedToken.access_token}` },
      },
    );
    return res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    // If API returns 404 (e.g. editorial playlists), try embed page fallback
    if (status === 404) {
      try {
        const embedData = await getPlaylistFromEmbed(playlistId);
        if (embedData) {
          return res.json(embedData);
        }
      } catch (embedError) {
        console.error("Embed fallback failed:", embedError.message);
      }
    }
    const message =
      error.response?.data?.error?.message || "Failed to fetch playlist";
    return res.status(status).json({ error: message });
  }
});

const SHOW_ID_PATTERN = /^[a-zA-Z0-9]+$/;
const MAX_SHOW_IDS = 100;

const getValidSpotifyToken = async () => {
  const cached = getCachedToken();
  if (cached) return cached.access_token;
  const fresh = await getSpotifyToken();
  return fresh?.access_token || null;
};

// Batched episodes endpoint backed by SQLite + SWR cache. Replaces the
// per-show fan-out that the frontend used to do directly against Spotify.
app.post("/api/shows/episodes", episodesLimiter, async (req, res) => {
  const { showIds, limit } = req.body || {};

  if (!Array.isArray(showIds) || showIds.length === 0) {
    return res.status(400).json({ error: "showIds must be a non-empty array" });
  }
  if (showIds.length > MAX_SHOW_IDS) {
    return res
      .status(400)
      .json({ error: `showIds must contain at most ${MAX_SHOW_IDS} entries` });
  }
  if (!showIds.every((id) => typeof id === "string" && SHOW_ID_PATTERN.test(id))) {
    return res.status(400).json({ error: "showIds contains invalid IDs" });
  }

  let effectiveLimit = Number.isFinite(limit) ? Math.floor(limit) : 5;
  if (effectiveLimit < 1) effectiveLimit = 1;
  if (effectiveLimit > 50) effectiveLimit = 50;

  try {
    const data = await episodeCache.getEpisodesForShows(
      showIds,
      effectiveLimit,
      getValidSpotifyToken,
    );
    return res.json(data);
  } catch (err) {
    console.error("Error in /api/shows/episodes:", err.message || err);
    return res.status(500).json({ error: "Failed to fetch show episodes" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
