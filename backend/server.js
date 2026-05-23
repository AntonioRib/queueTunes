// server.js
const express = require("express");
const axios = require("axios");
const qs = require("qs");
const cors = require("cors");
const { LocalStorage } = require("node-localstorage");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5333;

// Spotify Client Credentials
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

app.use(cors());
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
  console.log("Token:", token);
  const savedToken = JSON.parse(token);
  console.log("Saved Token:", savedToken);
  if (
    savedToken &&
    savedToken.expiration_time > Date.now() &&
    savedToken.access_token
  ) {
    console.log("Saved Token:", savedToken);
    return savedToken;
  }

  return null;
};

// Endpoint to get the access token
app.get("/api/token", async (req, res) => {
  console.log("Getting a call to get the token");
  const savedToken = getCachedToken();
  if (savedToken) {
    console.log("Saved token found");
    return res.json({
      access_token: savedToken.access_token,
      expiration_time: savedToken.expiration_time,
    });
  }

  console.log("No saved token found, getting new token");
  const token = await getSpotifyToken();
  if (token) {
    console.log("New Token:", token);
    return res.json({
      access_token: token.access_token,
      expiration_time: token.expiration_time,
    });
  } else {
    console.log("Failed to get token");
    return res.status(500).json({ error: "Failed to get token" });
  }
});

app.get("/", (req, res) => {
  console.log("Hello World");
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
app.get("/api/playlist/:id", async (req, res) => {
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

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
