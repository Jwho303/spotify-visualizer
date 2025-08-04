require('dotenv').config();
const express = require('express');
const https = require('https');
const fs = require('fs');
const axios = require('axios');
const querystring = require('querystring');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

app.use(express.static('public'));
app.use(express.json());
app.use(session({
  secret: 'spotify-visualizer-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true, sameSite: 'none' }
}));

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = `https://127.0.0.1:${HTTPS_PORT}/callback`;

const generateRandomString = (length) => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

app.get('/login', (req, res) => {
  const state = generateRandomString(16);
  const scope = 'user-read-currently-playing user-read-playback-state streaming user-read-email user-read-private';

  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: scope,
      redirect_uri: REDIRECT_URI,
      state: state
    }));
});

app.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;

  if (state === null) {
    res.redirect('/#' + querystring.stringify({ error: 'state_mismatch' }));
  } else {
    try {
      const response = await axios.post('https://accounts.spotify.com/api/token', 
        querystring.stringify({
          code: code,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code'
        }), {
          headers: {
            'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      req.session.access_token = response.data.access_token;
      req.session.refresh_token = response.data.refresh_token;
      
      res.redirect('/');
    } catch (error) {
      console.error('Error getting tokens:', error);
      res.redirect('/#' + querystring.stringify({ error: 'invalid_token' }));
    }
  }
});

app.get('/refresh_token', async (req, res) => {
  const refresh_token = req.session.refresh_token;
  
  if (!refresh_token) {
    return res.status(401).json({ error: 'No refresh token' });
  }

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token',
      querystring.stringify({
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      }), {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    req.session.access_token = response.data.access_token;
    res.json({ access_token: response.data.access_token });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

app.get('/current-track', async (req, res) => {
  const access_token = req.session.access_token;
  
  if (!access_token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        'Authorization': 'Bearer ' + access_token
      }
    });

    if (response.status === 204 || !response.data) {
      return res.json({ playing: false });
    }

    const track = response.data.item;
    
    res.json({
      playing: response.data.is_playing,
      track: {
        name: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        album: track.album.name,
        albumArt: track.album.images[0]?.url,
        duration: track.duration_ms,
        progress: response.data.progress_ms
      }
    });
  } catch (error) {
    if (error.response && error.response.status === 401) {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('Error fetching current track:', error);
    res.status(500).json({ error: 'Failed to fetch current track' });
  }
});

app.get('/auth-status', (req, res) => {
  res.json({ 
    authenticated: !!req.session.access_token,
    access_token: req.session.access_token 
  });
});

// Media control endpoints
app.post('/play', async (req, res) => {
  const access_token = req.session.access_token;
  if (!access_token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    await axios.put('https://api.spotify.com/v1/me/player/play', {}, {
      headers: {
        'Authorization': 'Bearer ' + access_token
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error playing:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to play' });
  }
});

app.post('/pause', async (req, res) => {
  const access_token = req.session.access_token;
  if (!access_token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    await axios.put('https://api.spotify.com/v1/me/player/pause', {}, {
      headers: {
        'Authorization': 'Bearer ' + access_token
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error pausing:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to pause' });
  }
});

app.post('/next', async (req, res) => {
  const access_token = req.session.access_token;
  if (!access_token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    await axios.post('https://api.spotify.com/v1/me/player/next', {}, {
      headers: {
        'Authorization': 'Bearer ' + access_token
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error skipping to next:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to skip to next' });
  }
});

app.post('/previous', async (req, res) => {
  const access_token = req.session.access_token;
  if (!access_token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    await axios.post('https://api.spotify.com/v1/me/player/previous', {}, {
      headers: {
        'Authorization': 'Bearer ' + access_token
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error skipping to previous:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to skip to previous' });
  }
});

// HTTP server (redirects to HTTPS)
app.listen(PORT, () => {
  console.log(`HTTP Server running on http://localhost:${PORT} (redirects to HTTPS)`);
});

// HTTPS server
try {
  const httpsOptions = {
    key: fs.readFileSync('./ssl/key.pem'),
    cert: fs.readFileSync('./ssl/cert.pem')
  };

  https.createServer(httpsOptions, app).listen(HTTPS_PORT, () => {
    console.log(`HTTPS Server running on https://127.0.0.1:${HTTPS_PORT}`);
    console.log(`\n⚠️  IMPORTANT: Add https://127.0.0.1:${HTTPS_PORT}/callback to your Spotify app redirect URIs`);
    console.log(`\nNote: You'll see a browser warning about the self-signed certificate - this is normal for local development.`);
    console.log(`Click "Advanced" and "Proceed" to continue.`);
  });
} catch (error) {
  console.error('Failed to start HTTPS server. Make sure SSL certificates exist in ./ssl directory');
  console.error('Run: mkdir -p ssl && openssl req -x509 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes');
}