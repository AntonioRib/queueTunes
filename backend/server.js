// server.js
const express = require("express");
const axios = require("axios");
const qs = require("qs");
const cors = require("cors");
const { LocalStorage } = require("node-localstorage");
require("dotenv").config();

const app = express();
const port = 5333;

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
  const savedToken = getCachedToken();
  if (savedToken) {
    res.json({
      access_token: savedToken.access_token,
      expiration_time: savedToken.expiration_time,
    });
    return;
  }

  console.log("No saved token found, getting new token");
  const token = await getSpotifyToken();
  if (token) {
    console.log("New Token:", token);
    res.json({
      access_token: token.access_token,
      expiration_time: token.expiration_time,
    });
  } else {
    console.log("Failed to get token");
    res.status(500).json({ error: "Failed to get token" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
