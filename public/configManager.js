class ConfigManager {
    constructor() {
        this.defaultConfig = {
            maxParticles: 400,
            emissionRate: 6,
            particleSize: 2.5,
            speedMultiplier: 1.0,
            decayRate: 0.005,
            trailOpacity: 0.08,
            shadowBlur: 0,
            enableShadows: false,
            enableGlow: true,
            showMediaControls: false
        };
        this.storageKey = 'spotify-visualizer-config';
    }

    saveConfig(config) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(config));
            return true;
        } catch (error) {
            console.error('Error saving config:', error);
            return false;
        }
    }

    loadConfig() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const config = JSON.parse(saved);
                // Merge with defaults to ensure all properties exist
                return { ...this.defaultConfig, ...config };
            }
        } catch (error) {
            console.error('Error loading config:', error);
        }
        return this.defaultConfig;
    }

    resetConfig() {
        try {
            localStorage.removeItem(this.storageKey);
            return this.defaultConfig;
        } catch (error) {
            console.error('Error resetting config:', error);
            return this.defaultConfig;
        }
    }

    exportConfig() {
        const config = this.loadConfig();
        const dataStr = JSON.stringify(config, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'spotify-visualizer-config.json';
        link.click();
        
        URL.revokeObjectURL(url);
    }

    importConfig(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const config = JSON.parse(e.target.result);
                    const mergedConfig = { ...this.defaultConfig, ...config };
                    this.saveConfig(mergedConfig);
                    resolve(mergedConfig);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('File read error'));
            reader.readAsText(file);
        });
    }
}