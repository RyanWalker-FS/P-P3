const express = require("express");
const router = express.Router();
const querystring = require("querystring");
const SpotifyWebApi = require("spotify-web-api-node");

// Initialize Spotify API
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI,
});

// Generate random string for state parameter
function generateRandomString(length) {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Login route - redirects to Spotify authorization
router.get("/login", (req, res) => {
  const state = generateRandomString(16);
  const scope =
    "user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing user-read-recently-played user-top-read playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private";

  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: process.env.CLIENT_ID,
        scope: scope,
        redirect_uri: process.env.REDIRECT_URI,
        state: state,
      })
  );
});

// Callback route - handles the redirect from Spotify
router.get("/callback", async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const error = req.query.error || null;

  if (error) {
    console.error("Spotify auth error:", error);
    return res.redirect(
      "/#" +
        querystring.stringify({
          error: error,
        })
    );
  }

  if (state === null) {
    return res.redirect(
      "/#" +
        querystring.stringify({
          error: "state_mismatch",
        })
    );
  }

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token, expires_in } = data.body;

    // Set cookies
    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: expires_in * 1000, // Convert to milliseconds
    });
    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    // Redirect to frontend with tokens
    res.redirect(
      "/#" +
        querystring.stringify({
          access_token: access_token,
          refresh_token: refresh_token,
          expires_in: expires_in,
        })
    );
  } catch (error) {
    console.error("Error getting tokens:", error);
    res.redirect(
      "/#" +
        querystring.stringify({
          error: "invalid_token",
        })
    );
  }
});

// Refresh token route
router.get("/refresh_token", async (req, res) => {
  const refresh_token = req.cookies.refresh_token;

  if (!refresh_token) {
    return res.status(401).json({ error: "No refresh token found" });
  }

  try {
    spotifyApi.setRefreshToken(refresh_token);
    const data = await spotifyApi.refreshAccessToken();
    const access_token = data.body.access_token;
    const expires_in = data.body.expires_in;

    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: expires_in * 1000,
    });
    res.json({ access_token, expires_in });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({ error: "Failed to refresh token" });
  }
});

module.exports = router;
