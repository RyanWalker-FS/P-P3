# Spotify Dashboard

A modern, responsive web application that provides users with a personalized Spotify dashboard, allowing them to interact with their Spotify account, view their top tracks and artists, manage playlists, and search for music.

![Spotify Dashboard Preview](preview.png)

## Features

### 🎵 Music Discovery

- Search for tracks, artists, and albums
- View detailed track information
- Play previews of tracks
- Browse through search results with a beautiful grid layout

### 🎧 Personal Music Stats

- View your top tracks
- Discover your most listened to artists
- See your favorite genres
- Access your playlists

### 🔐 Secure Authentication

- Spotify OAuth 2.0 integration
- Secure token management
- Automatic token refresh
- Persistent session handling

### 🎨 Modern UI/UX

- Dark theme matching Spotify's aesthetic
- Responsive design for all devices
- Smooth animations and transitions
- Intuitive navigation
- Accordion-style collapsible sections

## Tech Stack

### Frontend

- HTML5
- CSS3 (Tailwind CSS)
- JavaScript (ES6+)
- Font Awesome Icons

### Backend

- Node.js
- Express.js
- Spotify Web API

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Spotify Developer Account

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/spotify-dashboard.git
cd spotify-dashboard
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file in the root directory with your Spotify credentials:

```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
```

4. Start the development server

```bash
npm start
```

5. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
spotify-dashboard/
├── public/
│   ├── dashboard.html
│   ├── index.html
│   └── styles.css
├── routes/
│   ├── api.js
│   ├── auth.js
│   └── spotify.js
├── server.js
├── package.json
└── README.md
```

## Features in Detail

### Authentication

- Secure OAuth 2.0 implementation
- Token management with automatic refresh
- HTTP-only cookies for secure storage
- State validation for security

### User Interface

- **Navigation**

  - Fixed sidebar
  - Main content area
  - Search functionality
  - User profile section

- **Content Sections**

  - Search Results
  - Top Tracks
  - Top Artists
  - Playlists

- **Interactive Elements**
  - Collapsible sections
  - Hover effects
  - Loading states
  - Error messages

### API Integration

- User profile data
- Top tracks and artists
- Playlist management
- Search functionality
- Automatic retry on token expiration

## Security Features

- Secure token storage
- Automatic token refresh
- State validation
- Protected API endpoints
- Rate limiting
- Error handling

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Spotify for their amazing API
- Tailwind CSS for the utility-first CSS framework
- Font Awesome for the beautiful icons

## Support

For support, email support@example.com or join our Slack channel.

## Roadmap

- [ ] Add playlist creation functionality
- [ ] Implement track recommendations
- [ ] Add user statistics and insights
- [ ] Create mobile app version
- [ ] Add collaborative playlist features

## Authors

- **Your Name** - _Initial work_ - [YourUsername](https://github.com/yourusername)

## Acknowledgments

- Hat tip to anyone whose code was used
- Inspiration
- etc
