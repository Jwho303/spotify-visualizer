// Spotify Implicit Grant Flow for GitHub Pages
class SpotifyAuth {
    constructor() {
        this.clientId = '84bfdfed1dee49f090dce8bab06a58e6'; // You'll need to replace this
        this.redirectUri = window.location.origin + window.location.pathname;
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    // Generate random string for state parameter
    generateRandomString(length) {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    // Redirect to Spotify authorization
    login() {
        const state = this.generateRandomString(16);
        const scope = 'user-read-currently-playing user-read-playback-state user-modify-playback-state';
        
        const authUrl = 'https://accounts.spotify.com/authorize?' +
            new URLSearchParams({
                response_type: 'token',
                client_id: this.clientId,
                scope: scope,
                redirect_uri: this.redirectUri,
                state: state,
                show_dialog: 'true'
            });

        window.location.href = authUrl;
    }

    // Parse access token from URL hash
    parseTokenFromUrl() {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        
        const accessToken = params.get('access_token');
        const expiresIn = params.get('expires_in');
        const state = params.get('state');

        if (accessToken) {
            this.accessToken = accessToken;
            this.tokenExpiry = Date.now() + (parseInt(expiresIn) * 1000);
            
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            return true;
        }
        return false;
    }

    // Check if token is valid
    isAuthenticated() {
        return this.accessToken && Date.now() < this.tokenExpiry;
    }

    // Get stored token
    getAccessToken() {
        return this.accessToken;
    }

    // Make authenticated request to Spotify API
    async spotifyRequest(endpoint) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
            headers: {
                'Authorization': 'Bearer ' + this.accessToken
            }
        });

        if (response.status === 401) {
            // Token expired
            this.accessToken = null;
            this.tokenExpiry = null;
            throw new Error('Token expired');
        }

        return response;
    }

    // Get current playing track
    async getCurrentTrack() {
        try {
            const response = await this.spotifyRequest('/me/player/currently-playing');
            
            if (response.status === 204 || !response.ok) {
                return { playing: false };
            }

            const data = await response.json();
            const track = data.item;

            if (!track) {
                return { playing: false };
            }

            return {
                playing: data.is_playing,
                track: {
                    name: track.name,
                    artist: track.artists.map(a => a.name).join(', '),
                    album: track.album.name,
                    albumArt: track.album.images[0]?.url,
                    duration: track.duration_ms,
                    progress: data.progress_ms
                }
            };
        } catch (error) {
            console.error('Error fetching current track:', error);
            throw error;
        }
    }

    // Media control methods
    async play() {
        return await this.spotifyRequest('/me/player/play', { method: 'PUT' });
    }

    async pause() {
        return await this.spotifyRequest('/me/player/pause', { method: 'PUT' });
    }

    async next() {
        return await this.spotifyRequest('/me/player/next', { method: 'POST' });
    }

    async previous() {
        return await this.spotifyRequest('/me/player/previous', { method: 'POST' });
    }
}