// Spotify Authorization Code Flow with PKCE for GitHub Pages
class SpotifyAuth {
    constructor() {
        this.clientId = '84bfdfed1dee49f090dce8bab06a58e6';
        this.redirectUri = window.location.origin + window.location.pathname;
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        this.codeVerifier = null;
    }

    // Generate random string for PKCE
    generateRandomString(length) {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const values = crypto.getRandomValues(new Uint8Array(length));
        return values.reduce((acc, x) => acc + possible[x % possible.length], "");
    }

    // Generate SHA256 hash for PKCE
    async sha256(plain) {
        const encoder = new TextEncoder();
        const data = encoder.encode(plain);
        return window.crypto.subtle.digest('SHA-256', data);
    }

    // Base64 encode for PKCE
    base64encode(input) {
        return btoa(String.fromCharCode(...new Uint8Array(input)))
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
    }

    // Generate PKCE challenge
    async generateCodeChallenge(codeVerifier) {
        const hashed = await this.sha256(codeVerifier);
        return this.base64encode(hashed);
    }

    // Redirect to Spotify authorization
    async login() {
        const codeVerifier = this.generateRandomString(128);
        const codeChallenge = await this.generateCodeChallenge(codeVerifier);
        const state = this.generateRandomString(16);
        const scope = 'user-read-currently-playing user-read-playback-state user-modify-playback-state';
        
        // Store code verifier for later use
        localStorage.setItem('spotify_code_verifier', codeVerifier);
        localStorage.setItem('spotify_auth_state', state);
        
        const authUrl = 'https://accounts.spotify.com/authorize?' +
            new URLSearchParams({
                response_type: 'code',
                client_id: this.clientId,
                scope: scope,
                redirect_uri: this.redirectUri,
                state: state,
                code_challenge_method: 'S256',
                code_challenge: codeChallenge
            });

        window.location.href = authUrl;
    }

    // Parse authorization code from URL
    async handleCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
            console.error('Authorization error:', error);
            return false;
        }

        if (!code) {
            return false;
        }

        // Verify state
        const savedState = localStorage.getItem('spotify_auth_state');
        if (state !== savedState) {
            console.error('State mismatch');
            return false;
        }

        // Get stored code verifier
        const codeVerifier = localStorage.getItem('spotify_code_verifier');
        if (!codeVerifier) {
            console.error('No code verifier found');
            return false;
        }

        // Exchange code for token
        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: this.clientId,
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: this.redirectUri,
                    code_verifier: codeVerifier,
                }),
            });

            const data = await response.json();
            
            if (data.access_token) {
                this.accessToken = data.access_token;
                this.refreshToken = data.refresh_token;
                this.tokenExpiry = Date.now() + (data.expires_in * 1000);
                
                // Store tokens
                localStorage.setItem('spotify_access_token', this.accessToken);
                localStorage.setItem('spotify_refresh_token', this.refreshToken);
                localStorage.setItem('spotify_token_expiry', this.tokenExpiry);
                
                // Clean up
                localStorage.removeItem('spotify_code_verifier');
                localStorage.removeItem('spotify_auth_state');
                
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
                
                return true;
            }
        } catch (error) {
            console.error('Token exchange error:', error);
        }
        
        return false;
    }

    // Load tokens from storage
    loadStoredTokens() {
        this.accessToken = localStorage.getItem('spotify_access_token');
        this.refreshToken = localStorage.getItem('spotify_refresh_token');
        this.tokenExpiry = parseInt(localStorage.getItem('spotify_token_expiry') || '0');
    }

    // Check if token is valid
    isAuthenticated() {
        return this.accessToken && Date.now() < this.tokenExpiry;
    }

    // Refresh token
    async refreshAccessToken() {
        if (!this.refreshToken) {
            return false;
        }

        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: this.refreshToken,
                    client_id: this.clientId,
                }),
            });

            const data = await response.json();
            
            if (data.access_token) {
                this.accessToken = data.access_token;
                this.tokenExpiry = Date.now() + (data.expires_in * 1000);
                
                // Update stored tokens
                localStorage.setItem('spotify_access_token', this.accessToken);
                localStorage.setItem('spotify_token_expiry', this.tokenExpiry);
                
                if (data.refresh_token) {
                    this.refreshToken = data.refresh_token;
                    localStorage.setItem('spotify_refresh_token', this.refreshToken);
                }
                
                return true;
            }
        } catch (error) {
            console.error('Token refresh error:', error);
        }
        
        return false;
    }

    // Get stored token
    getAccessToken() {
        return this.accessToken;
    }

    // Make authenticated request to Spotify API
    async spotifyRequest(endpoint, options = {}) {
        if (!this.isAuthenticated()) {
            // Try to refresh token
            const refreshed = await this.refreshAccessToken();
            if (!refreshed) {
                throw new Error('Not authenticated');
            }
        }

        const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
            ...options,
            headers: {
                'Authorization': 'Bearer ' + this.accessToken,
                ...options.headers
            }
        });

        if (response.status === 401) {
            // Token expired, try refresh
            const refreshed = await this.refreshAccessToken();
            if (refreshed) {
                // Retry request
                return this.spotifyRequest(endpoint, options);
            }
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

    // Logout
    logout() {
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        localStorage.removeItem('spotify_token_expiry');
    }
}