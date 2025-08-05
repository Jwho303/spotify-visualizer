class AudioAnalyzer {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.source = null;
        this.isInitialized = false;
        this.stream = null;
    }

    async initialize() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 512;
            this.analyser.smoothingTimeConstant = 0.85;
            
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);

            console.log('Requesting system audio capture...');
            console.log('Note: You must select "Entire Screen" for system audio on most browsers');
            
            // Request display media with audio only focus
            this.stream = await navigator.mediaDevices.getDisplayMedia({ 
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    sampleRate: 48000,
                    channelCount: 2,
                    sampleSize: 16,
                    // Request system audio
                    systemAudio: 'include',
                    suppressLocalAudioPlayback: false
                },
                video: {
                    width: 1,
                    height: 1
                },
                // System audio preferences
                systemAudio: 'include',
                selfBrowserSurface: 'exclude',
                surfaceSwitching: 'exclude',
                preferCurrentTab: false
            });
            
            // Immediately stop video track to reduce overhead
            const videoTracks = this.stream.getVideoTracks();
            videoTracks.forEach(track => {
                track.stop();
                this.stream.removeTrack(track);
            });
            
            // Check if audio track is available
            const audioTracks = this.stream.getAudioTracks();
            if (audioTracks.length === 0) {
                throw new Error('No audio track available. Make sure to share audio when selecting screen.');
            }
            
            // Get audio track info
            const audioTrack = audioTracks[0];
            const trackSettings = audioTrack.getSettings();
            const trackLabel = audioTrack.label.toLowerCase();
            
            // Create audio source
            this.source = this.audioContext.createMediaStreamSource(this.stream);
            this.source.connect(this.analyser);
            
            this.isInitialized = true;
            
            // Log capture type
            if (trackLabel.includes('system') || trackLabel.includes('desktop')) {
                this.captureType = 'system';
                console.log('✅ System audio capture successful!');
            } else {
                this.captureType = 'limited';
                console.log('⚠️ Audio capture active but may be limited to tab/window audio');
                console.log('For full system audio, select "Entire Screen" when sharing');
            }
            
            console.log('Audio track:', {
                label: audioTrack.label,
                settings: trackSettings
            });
            
            return true;
        } catch (error) {
            console.error('Failed to capture system audio:', error.message);
            
            if (error.name === 'NotAllowedError') {
                console.error('Permission denied. User must allow screen sharing with audio.');
            } else if (error.name === 'NotFoundError') {
                console.error('No audio sources found.');
            }
            
            return false;
        }
    }

    getFrequencyData() {
        if (!this.isInitialized || !this.analyser) {
            return new Uint8Array(128).fill(0);
        }
        this.analyser.getByteFrequencyData(this.dataArray);
        return this.dataArray;
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

    destroy() {
        if (this.source) {
            this.source.disconnect();
        }
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}