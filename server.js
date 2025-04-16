require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const querystring = require("querystring");
const SpotifyWebApi = require("spotify-web-api-node");

// Import routes
const apiRoutes = require("./routes/api");
const authRoutes = require("./routes/auth");

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// CORS configuration
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log("Cookies:", req.cookies);
  next();
});

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
app.get("/login", (req, res) => {
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

// Callback route
app.get("/callback", async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;

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
    const { access_token, refresh_token } = data.body;

    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: false, // Set to false for local development
      sameSite: "lax",
      maxAge: 3600000, // 1 hour
      path: "/",
    });
    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: false, // Set to false for local development
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: "/",
    });

    // Redirect to dashboard instead of home page
    res.redirect("/dashboard");
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

// Mount routes
app.use("/api", apiRoutes);
app.use("/auth", authRoutes);

// Root route
app.get("/", async (req, res) => {
  try {
    const accessToken = req.cookies.access_token;
    const refreshToken = req.cookies.refresh_token;

    if (accessToken && refreshToken) {
      res.redirect("/dashboard");
    } else {
      res.sendFile(path.join(__dirname, "public", "index.html"));
    }
  } catch (error) {
    console.error("Error in root route:", error);
    res.sendFile(path.join(__dirname, "public", "index.html"));
  }
});

// Dashboard route
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Environment variables:", {
    CLIENT_ID: process.env.CLIENT_ID ? "Set" : "Not set",
    CLIENT_SECRET: process.env.CLIENT_SECRET ? "Set" : "Not set",
    REDIRECT_URI: process.env.REDIRECT_URI ? "Set" : "Not set",
  });
});
