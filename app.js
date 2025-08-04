class SpotifyVisualizer {
    constructor() {
        this.currentTrack = null;
        this.isAuthenticated = false;
        this.audioAnalyzer = new AudioAnalyzer();
        this.spotifyPlayer = new SpotifyWebPlayer();
        this.particleSystem = null;
        this.colorExtractor = new ColorExtractor();
        this.animationId = null;
        this.audioEnabled = false;
        this.useWebPlayer = false;
        this.accessToken = null;
        this.configManager = new ConfigManager();
        
        // FPS tracking
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = performance.now();
        
        // Background transition system
        this.currentGradient = null;
        this.transitionDuration = 2000; // 2 seconds
        
        this.init();
    }

    async init() {
        await this.checkAuthStatus();
        this.setupUI();
        this.setupParticles();
        
        // Set initial dark background
        this.currentGradient = 'linear-gradient(135deg, #0a0a0a, #1a1a1a, #0f0f0f)';
        document.body.style.background = this.currentGradient;
        
        if (this.isAuthenticated) {
            this.startTrackPolling();
            this.startAnimation();
        }
    }

    async checkAuthStatus() {
        try {
            const response = await fetch('/auth-status');
            const data = await response.json();
            this.isAuthenticated = data.authenticated;
            this.accessToken = data.access_token;
            
            if (!this.isAuthenticated) {
                document.getElementById('login-container').classList.remove('hidden');
                document.getElementById('visualizer-container').style.display = 'none';
            } else {
                document.getElementById('login-container').classList.add('hidden');
                document.getElementById('visualizer-container').style.display = 'block';
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
        }
    }

    setupUI() {
        document.getElementById('login-btn').addEventListener('click', () => {
            window.location.href = '/login';
        });

        document.getElementById('enable-audio').addEventListener('click', async () => {
            await this.initializeAudio(true); // true = prefer screen capture
        });
        
        document.getElementById('use-microphone').addEventListener('click', async () => {
            await this.initializeAudio(false); // false = use microphone
        });

        this.updateAlbumArtSize();
        window.addEventListener('resize', () => this.updateAlbumArtSize());
        
        if (this.isAuthenticated) {
            document.getElementById('audio-permission').classList.remove('hidden');
        }
        
        this.setupDebugControls();
        this.setupMediaControls();
        this.setupContextMenu();
        this.setupKeyboardControls();
    }
    
    setupDebugControls() {
        const debugBtn = document.getElementById('debug-toggle-btn');
        const debugPanel = document.getElementById('debug-panel');
        const closeBtn = document.getElementById('toggle-debug');
        
        debugBtn.addEventListener('click', () => {
            debugPanel.classList.toggle('hidden');
        });
        
        closeBtn.addEventListener('click', () => {
            debugPanel.classList.add('hidden');
        });
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                
                // Update tab buttons
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update tab content
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(`${targetTab}-tab`).classList.add('active');
            });
        });
        
        // Slider controls
        const sliders = [
            { id: 'max-particles', prop: 'maxParticles', display: 'max-particles-value' },
            { id: 'emission-rate', prop: 'emissionRate', display: 'emission-rate-value' },
            { id: 'particle-size', prop: 'particleSize', display: 'particle-size-value', float: true },
            { id: 'speed-multiplier', prop: 'speedMultiplier', display: 'speed-multiplier-value', float: true },
            { id: 'decay-rate', prop: 'decayRate', display: 'decay-rate-value', float: true },
            { id: 'trail-opacity', prop: 'trailOpacity', display: 'trail-opacity-value', float: true },
            { id: 'shadow-blur', prop: 'shadowBlur', display: 'shadow-blur-value' },
            { id: 'particle-opacity', prop: 'particleOpacity', display: 'particle-opacity-value', float: true }
        ];
        
        sliders.forEach(slider => {
            const element = document.getElementById(slider.id);
            const display = document.getElementById(slider.display);
            
            element.addEventListener('input', (e) => {
                const value = slider.float ? parseFloat(e.target.value) : parseInt(e.target.value);
                
                // Format display for very small numbers
                if (slider.float && value < 0.01) {
                    display.textContent = value.toFixed(3);
                } else if (slider.float) {
                    display.textContent = value.toFixed(2);
                } else {
                    display.textContent = value;
                }
                
                if (this.particleSystem) {
                    this.particleSystem.updateSettings({ [slider.prop]: value });
                }
            });
        });
        
        // Checkbox controls
        document.getElementById('enable-shadows').addEventListener('change', (e) => {
            if (this.particleSystem) {
                this.particleSystem.updateSettings({ enableShadows: e.target.checked });
            }
        });
        
        document.getElementById('enable-glow').addEventListener('change', (e) => {
            if (this.particleSystem) {
                this.particleSystem.updateSettings({ enableGlow: e.target.checked });
            }
        });
        
        // Blend mode dropdown
        document.getElementById('blend-mode').addEventListener('change', (e) => {
            if (this.particleSystem) {
                this.particleSystem.updateSettings({ blendMode: e.target.value });
            }
        });
        
        // Canvas blend mode dropdown
        document.getElementById('canvas-blend-mode').addEventListener('change', (e) => {
            if (this.particleSystem) {
                this.particleSystem.updateSettings({ canvasBlendMode: e.target.value });
            }
        });
        
        // Visual controls
        document.getElementById('show-media-controls').addEventListener('change', (e) => {
            const controls = document.getElementById('media-controls');
            if (e.target.checked) {
                controls.classList.remove('hidden');
            } else {
                controls.classList.add('hidden');
            }
            // Save to config
            const config = this.getCurrentConfig();
            config.showMediaControls = e.target.checked;
            this.configManager.saveConfig(config);
        });
        
        // Config management buttons
        document.getElementById('save-config').addEventListener('click', () => {
            const config = this.getCurrentConfig();
            if (this.configManager.saveConfig(config)) {
                this.showMessage('Config saved!', 'success');
            } else {
                this.showMessage('Error saving config', 'error');
            }
        });
        
        document.getElementById('export-config').addEventListener('click', () => {
            this.configManager.exportConfig();
        });
        
        document.getElementById('import-config-btn').addEventListener('click', () => {
            document.getElementById('import-config').click();
        });
        
        document.getElementById('import-config').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const config = await this.configManager.importConfig(file);
                    this.updateUIFromConfig(config);
                    if (this.particleSystem) {
                        this.particleSystem.updateSettings(config);
                    }
                    this.showMessage('Config imported!', 'success');
                } catch (error) {
                    this.showMessage('Error importing config', 'error');
                }
            }
        });
        
        // Retry audio button
        document.getElementById('retry-audio').addEventListener('click', () => {
            this.retryAudioCapture();
        });
        
        // Reset button
        document.getElementById('reset-settings').addEventListener('click', () => {
            const defaults = this.configManager.resetConfig();
            this.updateUIFromConfig(defaults);
            
            if (this.particleSystem) {
                this.particleSystem.updateSettings(defaults);
            }
        });
    }
    
    setupMediaControls() {
        document.getElementById('play-pause-btn').addEventListener('click', async () => {
            try {
                const response = await fetch('/current-track');
                const data = await response.json();
                
                if (data.playing) {
                    await fetch('/pause', { method: 'POST' });
                    document.getElementById('play-pause-btn').textContent = '▶️';
                } else {
                    await fetch('/play', { method: 'POST' });
                    document.getElementById('play-pause-btn').textContent = '⏸️';
                }
            } catch (error) {
                console.error('Error toggling playback:', error);
                this.showMessage('❌ Playback control failed', 'error');
            }
        });
        
        document.getElementById('next-btn').addEventListener('click', async () => {
            try {
                await fetch('/next', { method: 'POST' });
                this.showMessage('⏭️ Next track', 'success');
            } catch (error) {
                console.error('Error skipping to next:', error);
                this.showMessage('❌ Skip failed', 'error');
            }
        });
        
        document.getElementById('prev-btn').addEventListener('click', async () => {
            try {
                await fetch('/previous', { method: 'POST' });
                this.showMessage('⏮️ Previous track', 'success');
            } catch (error) {
                console.error('Error skipping to previous:', error);
                this.showMessage('❌ Skip failed', 'error');
            }
        });
    }
    
    setupContextMenu() {
        // Disable default context menu
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            
            // Toggle debug panel on right click
            const debugPanel = document.getElementById('debug-panel');
            if (debugPanel.classList.contains('hidden')) {
                debugPanel.classList.remove('hidden');
            } else {
                debugPanel.classList.add('hidden');
            }
        });
    }
    
    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            // F key for fullscreen toggle
            if (e.key === 'f' || e.key === 'F') {
                this.toggleFullscreen();
            }
            
            // Escape key to exit fullscreen or close debug panel
            if (e.key === 'Escape') {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else {
                    document.getElementById('debug-panel').classList.add('hidden');
                }
            }
        });
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            // Enter fullscreen
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            // Exit fullscreen
            document.exitFullscreen();
        }
    }

    updateAlbumArtSize() {
        const minDimension = Math.min(window.innerWidth, window.innerHeight);
        const artSize = minDimension * 0.5;
        const albumArtContainer = document.getElementById('album-art-container');
        albumArtContainer.style.width = `${artSize}px`;
        albumArtContainer.style.height = `${artSize}px`;
    }

    setupParticles() {
        const canvas = document.getElementById('particle-canvas');
        this.particleSystem = new ParticleSystem(canvas);
        
        // Load saved config
        const config = this.configManager.loadConfig();
        this.particleSystem.updateSettings(config);
        this.updateUIFromConfig(config);
    }
    
    updateUIFromConfig(config) {
        document.getElementById('max-particles').value = config.maxParticles;
        document.getElementById('max-particles-value').textContent = config.maxParticles;
        document.getElementById('emission-rate').value = config.emissionRate;
        document.getElementById('emission-rate-value').textContent = config.emissionRate;
        document.getElementById('particle-size').value = config.particleSize;
        document.getElementById('particle-size-value').textContent = config.particleSize;
        document.getElementById('speed-multiplier').value = config.speedMultiplier;
        document.getElementById('speed-multiplier-value').textContent = config.speedMultiplier;
        document.getElementById('decay-rate').value = config.decayRate;
        document.getElementById('decay-rate-value').textContent = config.decayRate;
        document.getElementById('trail-opacity').value = config.trailOpacity;
        document.getElementById('trail-opacity-value').textContent = config.trailOpacity;
        document.getElementById('shadow-blur').value = config.shadowBlur;
        document.getElementById('shadow-blur-value').textContent = config.shadowBlur;
        document.getElementById('enable-shadows').checked = config.enableShadows;
        document.getElementById('enable-glow').checked = config.enableGlow;
        document.getElementById('particle-opacity').value = config.particleOpacity;
        document.getElementById('particle-opacity-value').textContent = config.particleOpacity.toFixed(2);
        document.getElementById('blend-mode').value = config.blendMode;
        document.getElementById('canvas-blend-mode').value = config.canvasBlendMode;
        
        // Update visual controls and apply their state
        document.getElementById('show-media-controls').checked = config.showMediaControls;
        
        const controls = document.getElementById('media-controls');
        
        if (config.showMediaControls) {
            controls.classList.remove('hidden');
        } else {
            controls.classList.add('hidden');
        }
    }

    async startTrackPolling() {
        const pollTrack = async () => {
            try {
                const response = await fetch('/current-track');
                
                if (response.status === 401) {
                    const refreshResponse = await fetch('/refresh_token');
                    if (refreshResponse.ok) {
                        pollTrack();
                    } else {
                        window.location.href = '/login';
                    }
                    return;
                }
                
                const data = await response.json();
                
                if (data.playing && data.track) {
                    if (!this.currentTrack || this.currentTrack.albumArt !== data.track.albumArt) {
                        await this.updateTrack(data.track);
                    }
                    this.updateTrackInfo(data.track);
                } else {
                    this.clearTrack();
                }
            } catch (error) {
                console.error('Error fetching current track:', error);
            }
        };

        pollTrack();
        setInterval(pollTrack, 3000);
    }

    async updateTrack(track) {
        this.currentTrack = track;
        
        const currentArt = document.getElementById('album-art');
        const container = document.getElementById('album-art-container');
        
        // Create new image for crossfade
        const newArt = document.createElement('img');
        newArt.src = track.albumArt;
        newArt.style.position = 'absolute';
        newArt.style.width = '100%';
        newArt.style.height = '100%';
        newArt.style.objectFit = 'cover';
        newArt.style.opacity = '0';
        newArt.style.transition = 'opacity 1s ease-in-out';
        
        newArt.onload = async () => {
            container.appendChild(newArt);
            
            // Fade in new image
            setTimeout(() => {
                newArt.style.opacity = '1';
            }, 50);
            
            // Fade out and remove old image
            if (currentArt.src) {
                currentArt.style.transition = 'opacity 1s ease-in-out';
                currentArt.style.opacity = '0';
                setTimeout(() => {
                    if (currentArt.parentNode) {
                        currentArt.remove();
                    }
                }, 1000);
            } else {
                currentArt.remove();
            }
            
            newArt.id = 'album-art';
            
            // Extract colors from new album art
            const colorData = await this.colorExtractor.extractColors(track.albumArt, 6);
            console.log('🎨 Color data extracted:', colorData);
            this.particleSystem.setColors(colorData.particle);
            
            // Create smooth background transition
            console.log('🌈 Transitioning background with colors:', colorData.background);
            this.transitionBackground(colorData.background);
        };
    }

    updateTrackInfo(track) {
        document.getElementById('track-name').textContent = track.name;
        document.getElementById('artist-name').textContent = track.artist;
        
        // Update play/pause button state
        const playPauseBtn = document.getElementById('play-pause-btn');
        if (playPauseBtn) {
            playPauseBtn.textContent = '⏸️'; // Assume playing when we get track info
        }
    }

    clearTrack() {
        this.currentTrack = null;
        document.getElementById('album-art').src = '';
        document.getElementById('track-name').textContent = 'No track playing';
        document.getElementById('artist-name').textContent = '';
    }
    
    transitionBackground(backgroundColors) {
        console.log('🖼️ transitionBackground called with:', backgroundColors);
        
        if (!backgroundColors || backgroundColors.length < 2) {
            console.log('❌ Not enough background colors, skipping transition');
            return;
        }
        
        // Create gradient from the background colors
        const newGradient = `linear-gradient(135deg, ${backgroundColors[0]}, ${backgroundColors[1]}${backgroundColors[2] ? ', ' + backgroundColors[2] : ''})`;
        console.log('🎨 New gradient created:', newGradient);
        
        // If this is the first gradient, set it immediately
        if (!this.currentGradient) {
            console.log('🆕 Setting initial gradient');
            document.body.style.background = newGradient;
            this.currentGradient = newGradient;
            return;
        }
        
        console.log('🔄 Starting transition from:', this.currentGradient, 'to:', newGradient);
        
        // Force the background with !important and multiple methods
        document.body.style.background = newGradient;
        document.body.style.setProperty('background', newGradient, 'important');
        document.body.style.backgroundColor = ''; // Clear any solid background color
        this.currentGradient = newGradient;
        
        console.log('🎯 Background applied with force:', newGradient);
        console.log('🔍 Body background after setting:', document.body.style.background);
        console.log('🔍 Canvas mix-blend-mode:', document.getElementById('particle-canvas').style.mixBlendMode);
    }
    
    async updateTrackFromPlayer(track) {
        if (!track) return;
        
        const trackData = {
            name: track.name,
            artist: track.artists.map(a => a.name).join(', '),
            album: track.album.name,
            albumArt: track.album.images[0]?.url
        };
        
        if (!this.currentTrack || this.currentTrack.albumArt !== trackData.albumArt) {
            await this.updateTrack(trackData);
        }
        this.updateTrackInfo(trackData);
    }
    
    async initializeAudio(preferScreenCapture = true) {
        try {
            const success = await this.audioAnalyzer.initialize(preferScreenCapture);
            if (success) {
                this.audioEnabled = true;
                document.getElementById('audio-permission').classList.add('hidden');
                
                const captureType = this.audioAnalyzer.captureType;
                if (captureType === 'screen') {
                    this.showMessage('✅ Screen audio capture active!', 'success');
                } else {
                    this.showMessage('🎤 Microphone capture active', 'success');
                }
            } else {
                this.showMessage('❌ Could not access audio', 'error');
            }
        } catch (error) {
            console.error('Error enabling audio:', error);
            this.showMessage('❌ Audio initialization failed', 'error');
        }
    }

    startAnimation() {
        const animate = () => {
            // Calculate FPS
            this.frameCount++;
            const currentTime = performance.now();
            if (currentTime >= this.lastTime + 1000) {
                this.fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastTime));
                this.frameCount = 0;
                this.lastTime = currentTime;
                
                // Update FPS display
                const fpsElement = document.getElementById('fps');
                if (fpsElement) {
                    fpsElement.textContent = this.fps;
                    // Color code FPS
                    if (this.fps >= 50) {
                        fpsElement.style.color = '#1db954';
                    } else if (this.fps >= 30) {
                        fpsElement.style.color = '#ffa500';
                    } else {
                        fpsElement.style.color = '#ff4444';
                    }
                }
                
                // Update particle count
                const particleCountElement = document.getElementById('particle-count');
                if (particleCountElement && this.particleSystem) {
                    particleCountElement.textContent = this.particleSystem.getParticleCount();
                }
                
            }
            
            let audioLevel = 0;
            let bassLevel = 0;
            let trebleLevel = 0;
            
            if (this.audioEnabled) {
                if (this.useWebPlayer && this.spotifyPlayer.isReady) {
                    audioLevel = this.spotifyPlayer.getAverageVolume();
                    bassLevel = this.spotifyPlayer.getBassLevel();
                    trebleLevel = this.spotifyPlayer.getTrebleLevel();
                } else if (this.audioAnalyzer.isInitialized) {
                    audioLevel = this.audioAnalyzer.getAverageVolume();
                    bassLevel = this.audioAnalyzer.getBassLevel();
                    trebleLevel = this.audioAnalyzer.getTrebleLevel();
                }
            }
            
            if (!this.audioEnabled || (audioLevel === 0 && bassLevel === 0 && trebleLevel === 0)) {
                const time = Date.now() * 0.001;
                audioLevel = (Math.sin(time) + 1) * 0.15;
                bassLevel = (Math.sin(time * 0.5) + 1) * 0.15;
                trebleLevel = (Math.sin(time * 2) + 1) * 0.15;
            }
            
            // Update audio debug display
            this.updateAudioDebug(audioLevel, bassLevel, trebleLevel);
            
            this.particleSystem.update(audioLevel, bassLevel, trebleLevel);
            this.particleSystem.draw();
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        animate();
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.audioAnalyzer) {
            this.audioAnalyzer.destroy();
        }
        if (this.spotifyPlayer) {
            this.spotifyPlayer.destroy();
        }
    }
    
    getCurrentConfig() {
        return {
            maxParticles: parseInt(document.getElementById('max-particles').value),
            emissionRate: parseInt(document.getElementById('emission-rate').value),
            particleSize: parseFloat(document.getElementById('particle-size').value),
            speedMultiplier: parseFloat(document.getElementById('speed-multiplier').value),
            decayRate: parseFloat(document.getElementById('decay-rate').value),
            trailOpacity: parseFloat(document.getElementById('trail-opacity').value),
            shadowBlur: parseInt(document.getElementById('shadow-blur').value),
            enableShadows: document.getElementById('enable-shadows').checked,
            enableGlow: document.getElementById('enable-glow').checked,
            particleOpacity: parseFloat(document.getElementById('particle-opacity').value),
            blendMode: document.getElementById('blend-mode').value,
            canvasBlendMode: document.getElementById('canvas-blend-mode').value,
            showMediaControls: document.getElementById('show-media-controls').checked
        };
    }
    
    updateAudioDebug(audioLevel, bassLevel, trebleLevel) {
        // Get mid level too
        let midLevel = 0;
        if (this.audioAnalyzer.isInitialized) {
            midLevel = this.audioAnalyzer.getMidLevel();
            const captureType = this.audioAnalyzer.captureType;
            if (captureType === 'screen') {
                document.getElementById('audio-source').textContent = 'Source: 🖥️ Screen Audio Capture';
            } else if (captureType === 'microphone') {
                document.getElementById('audio-source').textContent = 'Source: 🎤 Microphone';
            } else {
                document.getElementById('audio-source').textContent = 'Source: Audio Capture';
            }
        } else {
            document.getElementById('audio-source').textContent = 'Source: 🎭 Synthetic (Demo)';
        }
        
        // Update level displays
        const volumePercent = Math.round(audioLevel * 100);
        const bassPercent = Math.round(bassLevel * 100);
        const midPercent = Math.round(midLevel * 100);
        const treblePercent = Math.round(trebleLevel * 100);
        
        document.getElementById('volume-level').textContent = `${volumePercent}%`;
        document.getElementById('bass-level').textContent = `${bassPercent}%`;
        document.getElementById('mid-level').textContent = `${midPercent}%`;
        document.getElementById('treble-level').textContent = `${treblePercent}%`;
        
        // Update progress bars
        document.getElementById('volume-bar').style.width = `${volumePercent}%`;
        document.getElementById('bass-bar').style.width = `${bassPercent}%`;
        document.getElementById('mid-bar').style.width = `${midPercent}%`;
        document.getElementById('treble-bar').style.width = `${treblePercent}%`;
    }
    
    showMessage(text, type) {
        // Create a temporary message element
        const message = document.createElement('div');
        message.textContent = text;
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'success' ? '#1db954' : '#ff4444'};
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 10000;
            font-size: 14px;
        `;
        
        document.body.appendChild(message);
        setTimeout(() => {
            document.body.removeChild(message);
        }, 2000);
    }
    
    retryAudioCapture() {
        console.log('Manual retry of audio capture...');
        
        if (this.audioAnalyzer) {
            // Destroy current analyzer
            this.audioAnalyzer.destroy();
            
            // Retry with screen capture preference
            this.audioAnalyzer.initialize(true).then(success => {
                if (success) {
                    const captureType = this.audioAnalyzer.captureType;
                    if (captureType === 'screen') {
                        this.showMessage('✅ Screen audio capture retry successful!', 'success');
                    } else {
                        this.showMessage('🎤 Microphone retry successful!', 'success');
                    }
                } else {
                    this.showMessage('❌ Audio retry failed', 'error');
                }
            });
        } else {
            this.showMessage('No audio system active to retry', 'error');
        }
    }
}

// Make SpotifyVisualizer available globally
window.SpotifyVisualizer = SpotifyVisualizer;

// Initialize when ready
if (window.spotifySDKReady) {
    window.visualizer = new SpotifyVisualizer();
} else {
    // Wait for SDK to be ready
    document.addEventListener('DOMContentLoaded', () => {
        if (window.spotifySDKReady && !window.visualizer) {
            window.visualizer = new SpotifyVisualizer();
        }
    });
}