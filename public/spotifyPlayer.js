class SpotifyWebPlayer {
    constructor() {
        this.player = null;
        this.deviceId = null;
        this.isReady = false;
        this.currentTrack = null;
        this.accessToken = null;
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.dataArray = null;
        this.onTrackChange = null;
    }

    async initialize(accessToken) {
        this.accessToken = accessToken;
        
        return new Promise((resolve, reject) => {
            if (!window.Spotify) {
                reject(new Error('Spotify SDK not loaded'));
                return;
            }

            this.player = new window.Spotify.Player({
                name: 'Spotify Visualizer',
                getOAuthToken: (cb) => {
                    cb(this.accessToken);
                },
                volume: 0.8
            });

            // Error handling
            this.player.addListener('initialization_error', ({ message }) => {
                console.error('Initialization Error:', message);
                reject(new Error(message));
            });

            this.player.addListener('authentication_error', ({ message }) => {
                console.error('Authentication Error:', message);
                reject(new Error(message));
            });

            this.player.addListener('account_error', ({ message }) => {
                console.error('Account Error:', message);
                reject(new Error(message));
            });

            this.player.addListener('playback_error', ({ message }) => {
                console.error('Playback Error:', message);
            });

            // Playback status updates
            this.player.addListener('player_state_changed', (state) => {
                if (!state) return;

                this.currentTrack = state.track_window.current_track;
                if (this.onTrackChange) {
                    this.onTrackChange(this.currentTrack);
                }
            });

            // Ready
            this.player.addListener('ready', ({ device_id }) => {
                console.log('Spotify Web Player ready with Device ID:', device_id);
                this.deviceId = device_id;
                this.isReady = true;
                this.setupAudioCapture();
                resolve(device_id);
            });

            // Not Ready
            this.player.addListener('not_ready', ({ device_id }) => {
                console.log('Device ID has gone offline:', device_id);
                this.isReady = false;
            });

            // Connect to the player
            this.player.connect().then(success => {
                if (!success) {
                    reject(new Error('Failed to connect to Spotify Web Player'));
                }
            });
        });
    }

    setupAudioCapture() {
        // Delay the setup to ensure the player has created audio elements
        setTimeout(() => {
            this.attemptAudioCapture();
        }, 2000);
        
        // Also try again after player state changes
        this.player.addListener('player_state_changed', () => {
            if (!this.source) {
                setTimeout(() => {
                    this.attemptAudioCapture();
                }, 1000);
            }
        });
    }
    
    attemptAudioCapture() {
        try {
            // Modern Spotify Web Player doesn't always create <audio> elements
            // Let's try multiple approaches
            
            // Approach 1: Look for audio elements
            const audioElements = document.querySelectorAll('audio');
            let spotifyAudio = null;
            
            // Look for any audio element
            for (let i = 0; i < audioElements.length; i++) {
                const audio = audioElements[i];
                spotifyAudio = audio; // Use any audio element we find
                break;
            }
            
            // Approach 2: Try to get audio from Web Audio API directly
            if (!spotifyAudio && this.audioContext) {
                // Set up a basic analyser without a source for now
                if (!this.analyser) {
                    this.analyser = this.audioContext.createAnalyser();
                    this.analyser.fftSize = 512;
                    this.analyser.smoothingTimeConstant = 0.85;
                    
                    const bufferLength = this.analyser.frequencyBinCount;
                    this.dataArray = new Uint8Array(bufferLength);
                    
                    console.log('Using synthetic audio data (no audio elements found)');
                    return true;
                }
            }

            if (spotifyAudio && !this.source) {
                if (!this.audioContext) {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }
                
                // Resume audio context if it's suspended
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
                
                this.source = this.audioContext.createMediaElementSource(spotifyAudio);
                this.analyser = this.audioContext.createAnalyser();
                
                this.analyser.fftSize = 512;
                this.analyser.smoothingTimeConstant = 0.85;
                
                this.source.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
                
                const bufferLength = this.analyser.frequencyBinCount;
                this.dataArray = new Uint8Array(bufferLength);
                
                console.log('✅ Real audio capture connected!');
                return true;
            } else if (this.source) {
                return true;
            } else {
                // Create a basic setup for synthetic data
                if (!this.audioContext) {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }
                
                if (!this.analyser) {
                    this.analyser = this.audioContext.createAnalyser();
                    this.analyser.fftSize = 512;
                    this.analyser.smoothingTimeConstant = 0.85;
                    
                    const bufferLength = this.analyser.frequencyBinCount;
                    this.dataArray = new Uint8Array(bufferLength);
                }
                
                return false; // Return false to indicate no real audio source
            }
        } catch (error) {
            console.error('Error setting up audio capture:', error);
            return false;
        }
    }

    getFrequencyData() {
        if (!this.analyser || !this.dataArray) {
            return new Uint8Array(256).fill(0);
        }
        
        if (this.source) {
            // Real audio source
            this.analyser.getByteFrequencyData(this.dataArray);
            return this.dataArray;
        } else {
            // Generate synthetic music-like data
            const time = Date.now() * 0.001;
            const syntheticData = new Uint8Array(this.dataArray.length);
            
            for (let i = 0; i < syntheticData.length; i++) {
                const freq = i / syntheticData.length;
                let amplitude = 0;
                
                // Bass frequencies (0-0.1)
                if (freq < 0.1) {
                    amplitude = Math.sin(time * 2 + freq * 10) * 80 + 60;
                }
                // Mid frequencies (0.1-0.5)
                else if (freq < 0.5) {
                    amplitude = Math.sin(time * 3 + freq * 20) * 60 + 40;
                }
                // High frequencies (0.5-1.0)
                else {
                    amplitude = Math.sin(time * 4 + freq * 30) * 40 + 20;
                }
                
                // Add some randomness
                amplitude += (Math.random() - 0.5) * 20;
                
                // Clamp to valid range
                syntheticData[i] = Math.max(0, Math.min(255, amplitude));
            }
            
            return syntheticData;
        }
    }

    getAverageVolume() {
        const data = this.getFrequencyData();
        const sum = data.reduce((acc, val) => acc + val, 0);
        return sum / data.length / 255;
    }

    getBassLevel() {
        const data = this.getFrequencyData();
        const bassRange = Math.floor(data.length * 0.1);
        let sum = 0;
        for (let i = 0; i < bassRange; i++) {
            sum += data[i];
        }
        return sum / bassRange / 255;
    }

    getMidLevel() {
        const data = this.getFrequencyData();
        const midStart = Math.floor(data.length * 0.1);
        const midEnd = Math.floor(data.length * 0.5);
        let sum = 0;
        for (let i = midStart; i < midEnd; i++) {
            sum += data[i];
        }
        return sum / (midEnd - midStart) / 255;
    }

    getTrebleLevel() {
        const data = this.getFrequencyData();
        const trebleStart = Math.floor(data.length * 0.5);
        let sum = 0;
        for (let i = trebleStart; i < data.length; i++) {
            sum += data[i];
        }
        return sum / (data.length - trebleStart) / 255;
    }

    async transferPlayback() {
        if (!this.deviceId) return false;
        
        try {
            const response = await fetch('https://api.spotify.com/v1/me/player', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    device_ids: [this.deviceId],
                    play: true
                })
            });
            
            return response.ok;
        } catch (error) {
            console.error('Error transferring playback:', error);
            return false;
        }
    }

    play() {
        if (this.player) {
            this.player.resume();
        }
    }

    pause() {
        if (this.player) {
            this.player.pause();
        }
    }

    destroy() {
        if (this.player) {
            this.player.disconnect();
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}