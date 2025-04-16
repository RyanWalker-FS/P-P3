const express = require("express");
const router = express.Router();
const SpotifyWebApi = require("spotify-web-api-node");

// Initialize Spotify API
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI,
});

// Middleware to validate token
const validateToken = async (req, res, next) => {
  try {
    const accessToken = req.cookies.access_token;
    const refreshToken = req.cookies.refresh_token;

    if (!accessToken) {
      console.log("No access token found in cookies");
      return res.status(401).json({ error: "No access token provided" });
    }

    if (!refreshToken) {
      console.log("No refresh token found in cookies");
      return res.status(401).json({ error: "No refresh token provided" });
    }

    // Set the tokens on the Spotify API instance
    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(refreshToken);

    // Try to make a simple request to validate the token
    try {
      await spotifyApi.getMe();
      next();
    } catch (error) {
      console.log("Token validation error:", error.message);
      // If the token is expired, try to refresh it
      if (error.statusCode === 401 && refreshToken) {
        try {
          console.log("Attempting to refresh token...");
          const data = await spotifyApi.refreshAccessToken();
          const newAccessToken = data.body.access_token;

          // Set the new access token
          spotifyApi.setAccessToken(newAccessToken);

          // Update the access token cookie
          res.cookie("access_token", newAccessToken, {
            httpOnly: true,
            secure: false, // Set to false for local development
            sameSite: "lax",
            maxAge: data.body.expires_in * 1000,
            path: "/",
          });

          console.log("Token refreshed successfully");
          next();
        } catch (refreshError) {
          console.error("Error refreshing token:", refreshError);
          return res.status(401).json({ error: "Invalid refresh token" });
        }
      } else {
        console.error("Token validation error:", error);
        return res.status(401).json({ error: "Invalid access token" });
      }
    }
  } catch (error) {
    console.error("Unexpected error in validateToken:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Apply validateToken middleware to all routes
router.use(validateToken);

// Auth status endpoint
router.get("/auth-status", async (req, res) => {
  try {
    const accessToken = req.cookies.access_token;
    const refreshToken = req.cookies.refresh_token;

    if (!accessToken || !refreshToken) {
      return res.status(401).json({
        authenticated: false,
        error: "Missing tokens",
      });
    }

    // Set the tokens on the Spotify API instance
    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(refreshToken);

    // Try to get user profile to verify token
    const me = await spotifyApi.getMe();

    res.json({
      authenticated: true,
      user: {
        id: me.body.id,
        display_name: me.body.display_name,
        email: me.body.email,
      },
    });
  } catch (error) {
    console.error("Auth status error:", error);
    res.status(401).json({
      authenticated: false,
      error: error.message,
    });
  }
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
    console.log("Fetching top tracks...");
    const data = await spotifyApi.getMyTopTracks({
      time_range: "medium_term",
      limit: 50,
    });

    console.log("Successfully fetched top tracks:", {
      total: data.body.items.length,
      firstTrack: data.body.items[0]?.name,
    });

    res.json(data.body);
  } catch (error) {
    console.error("Error getting top tracks:", {
      message: error.message,
      statusCode: error.statusCode,
      body: error.body,
    });

    if (error.statusCode === 403) {
      return res.status(403).json({
        error:
          "Permission denied. Make sure you have granted access to view your top tracks.",
        details: error.message,
      });
    } else {
      return res.status(500).json({
        error: "Failed to get top tracks",
        details: error.message,
      });
    }
  }
});

// Get user's top artists
router.get("/top/artists", async (req, res) => {
  try {
    console.log("Fetching top artists...");
    const data = await spotifyApi.getMyTopArtists({
      time_range: "medium_term",
      limit: 50,
    });

    console.log("Successfully fetched top artists:", {
      total: data.body.items.length,
      firstArtist: data.body.items[0]?.name,
    });

    res.json(data.body);
  } catch (error) {
    console.error("Error getting top artists:", {
      message: error.message,
      statusCode: error.statusCode,
      body: error.body,
    });

    if (error.statusCode === 403) {
      return res.status(403).json({
        error:
          "Permission denied. Make sure you have granted access to view your top artists.",
        details: error.message,
      });
    } else {
      return res.status(500).json({
        error: "Failed to get top artists",
        details: error.message,
      });
    }
  }
});

// Search for tracks
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }
    const data = await spotifyApi.searchTracks(q);
    res.json(data.body);
  } catch (error) {
    console.error("Error searching tracks:", error);
    res.status(500).json({ error: "Failed to search tracks" });
  }
});

module.exports = router;
