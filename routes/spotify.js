const express = require("express");
const router = express.Router();
const SpotifyWebApi = require("spotify-web-api-node");

// Initialize Spotify API
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI,
});

// Middleware to set access token
router.use((req, res, next) => {
  const access_token = req.cookies.access_token;
  if (!access_token) {
    return res.status(401).json({ error: "No access token found" });
  }
  spotifyApi.setAccessToken(access_token);
  next();
});

// Get user profile
router.get("/me", async (req, res) => {
  try {
    const data = await spotifyApi.getMe();
    res.json(data.body);
  } catch (error) {
    console.error("Error getting user profile:", error);
    res.status(500).json({ error: "Failed to get user profile" });
  }
});

// Get user's playlists
router.get("/playlists", async (req, res) => {
  try {
    const data = await spotifyApi.getUserPlaylists();
    res.json(data.body);
  } catch (error) {
    console.error("Error getting playlists:", error);
    res.status(500).json({ error: "Failed to get playlists" });
  }
});

// Get user's top tracks
router.get("/top/tracks", async (req, res) => {
  try {
    const data = await spotifyApi.getMyTopTracks({
      time_range: "medium_term",
      limit: 50,
    });
    res.json(data.body);
  } catch (error) {
    console.error("Error getting top tracks:", error);
    res.status(500).json({ error: "Failed to get top tracks" });
  }
});

// Get user's top artists
router.get("/top/artists", async (req, res) => {
  try {
    const data = await spotifyApi.getMyTopArtists({
      time_range: "medium_term",
      limit: 50,
    });
    res.json(data.body);
  } catch (error) {
    console.error("Error getting top artists:", error);
    res.status(500).json({ error: "Failed to get top artists" });
  }
});

// Get currently playing track
router.get("/player/currently-playing", async (req, res) => {
  try {
    const data = await spotifyApi.getMyCurrentPlayingTrack();
    res.json(data.body);
  } catch (error) {
    console.error("Error getting currently playing track:", error);
    res.status(500).json({ error: "Failed to get currently playing track" });
  }
});

// Control playback
router.put("/player/play", async (req, res) => {
  try {
    await spotifyApi.play();
    res.json({ message: "Playback started" });
  } catch (error) {
    console.error("Error starting playback:", error);
    res.status(500).json({ error: "Failed to start playback" });
  }
});

router.put("/player/pause", async (req, res) => {
  try {
    await spotifyApi.pause();
    res.json({ message: "Playback paused" });
  } catch (error) {
    console.error("Error pausing playback:", error);
    res.status(500).json({ error: "Failed to pause playback" });
  }
});

// Search for tracks
router.get("/search", async (req, res) => {
  const { q, type = "track" } = req.query;
  if (!q) {
    return res.status(400).json({ error: "Search query is required" });
  }

  try {
    const data = await spotifyApi.searchTracks(q, { limit: 10 });
    res.json(data.body);
  } catch (error) {
    console.error("Error searching tracks:", error);
    res.status(500).json({ error: "Failed to search tracks" });
  }
});

module.exports = router;
