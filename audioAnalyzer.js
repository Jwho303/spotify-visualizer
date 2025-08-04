class AudioAnalyzer {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.source = null;
        this.isInitialized = false;
        this.stream = null;
    }

    async initialize(preferScreenCapture = true) {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 512;
            this.analyser.smoothingTimeConstant = 0.85;
            
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);

            if (preferScreenCapture) {
                // Try screen/tab audio capture first
                try {
                    console.log('Requesting screen audio capture...');
                    this.stream = await navigator.mediaDevices.getDisplayMedia({ 
                        audio: {
                            echoCancellation: false,
                            noiseSuppression: false,
                            autoGainControl: false,
                            sampleRate: 48000
                        },
                        video: {
                            width: 1,
                            height: 1
                        }
                    });
                    
                    // Check if audio track is available
                    const audioTracks = this.stream.getAudioTracks();
                    if (audioTracks.length === 0) {
                        throw new Error('No audio track in screen capture');
                    }
                    
                    this.source = this.audioContext.createMediaStreamSource(this.stream);
                    this.source.connect(this.analyser);
                    
                    this.isInitialized = true;
                    this.captureType = 'screen';
                    console.log('✅ Screen audio capture successful!');
                    return true;
                } catch (displayError) {
                    console.log('Screen capture failed:', displayError.message);
                    
                    // Fallback to microphone
                    try {
                        console.log('Falling back to microphone...');
                        this.stream = await navigator.mediaDevices.getUserMedia({ 
                            audio: {
                                echoCancellation: false,
                                noiseSuppression: false,
                                autoGainControl: false
                            } 
                        });
                        
                        this.source = this.audioContext.createMediaStreamSource(this.stream);
                        this.source.connect(this.analyser);
                        
                        this.isInitialized = true;
                        this.captureType = 'microphone';
                        console.log('🎤 Using microphone as fallback');
                        return true;
                    } catch (micError) {
                        console.error('Microphone fallback failed:', micError);
                        return false;
                    }
                }
            } else {
                // Direct microphone request
                this.stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false
                    } 
                });
                
                this.source = this.audioContext.createMediaStreamSource(this.stream);
                this.source.connect(this.analyser);
                
                this.isInitialized = true;
                this.captureType = 'microphone';
                console.log('🎤 Using microphone');
                return true;
            }
        } catch (error) {
            console.error('Error initializing audio:', error);
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