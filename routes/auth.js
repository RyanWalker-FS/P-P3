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

// Login route
router.get("/login", (req, res) => {
  const state = generateRandomString(16);
  const scope =
    "user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing user-read-recently-played user-top-read playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private";

  // Set state cookie
  res.cookie("spotify_auth_state", state, {
    httpOnly: true,
    secure: false, // Set to false for local development
    sameSite: "lax",
    maxAge: 60 * 60 * 1000, // 1 hour
    path: "/",
  });

  const authUrl =
    "https://accounts.spotify.com/authorize?" +
    querystring.stringify({
      response_type: "code",
      client_id: process.env.CLIENT_ID,
      scope: scope,
      redirect_uri: process.env.REDIRECT_URI,
      state: state,
      show_dialog: true, // This will force the consent dialog to show every time
    });

  console.log("Redirecting to Spotify auth URL:", authUrl);
  res.redirect(authUrl);
});

// Callback route
router.get("/callback", async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies.spotify_auth_state;

  console.log("Received callback with:", {
    code: code ? "Present" : "Missing",
    state: state ? "Present" : "Missing",
    storedState: storedState ? "Present" : "Missing",
  });

  if (state === null || state !== storedState) {
    console.error("State mismatch:", { state, storedState });
    return res.redirect(
      "/#" +
        querystring.stringify({
          error: "state_mismatch",
        })
    );
  }

  // Clear the state cookie
  res.clearCookie("spotify_auth_state");

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token, expires_in } = data.body;

    console.log("Token exchange successful:", {
      access_token: access_token ? "Present" : "Missing",
      refresh_token: refresh_token ? "Present" : "Missing",
      expires_in,
    });

    // Clear existing cookies
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");

    // Set new cookies
    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: false, // Set to false for local development
      sameSite: "lax",
      maxAge: expires_in * 1000,
      path: "/",
    });

    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: false, // Set to false for local development
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: "/",
    });

    // Set the tokens on the Spotify API instance
    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);

    // Redirect to dashboard
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error in callback:", error);
    res.redirect(
      "/#" +
        querystring.stringify({
          error: "invalid_token",
        })
    );
  }
});

// Refresh token route
router.get("/refresh", async (req, res) => {
  const refresh_token = req.cookies.refresh_token;

  if (!refresh_token) {
    return res.status(401).json({ error: "No refresh token found" });
  }

  try {
    spotifyApi.setRefreshToken(refresh_token);
    const data = await spotifyApi.refreshAccessToken();
    const access_token = data.body.access_token;

    // Update the access token cookie
    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: false, // Set to false for local development
      sameSite: "lax",
      maxAge: data.body.expires_in * 1000,
      path: "/",
    });

    // Set the new access token
    spotifyApi.setAccessToken(access_token);

    res.json({ access_token });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

module.exports = router;
