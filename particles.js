class Particle {
    constructor(x, y, colors, settings) {
        this.x = x;
        this.y = y;
        this.originX = x;
        this.originY = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2 - 1;
        this.baseSize = settings.particleSize || 2.5;
        this.size = Math.max(0.01, Math.random() * this.baseSize * 1.5 + this.baseSize * 0.5);
        this.life = 1;
        this.decay = Math.random() * settings.decayRate * 1.5 + settings.decayRate * 0.5;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.angle = Math.random() * Math.PI * 2;
        this.angleSpeed = (Math.random() - 0.5) * 0.1;
        this.radius = Math.random() * 50;
    }

    update(audioLevel, bassLevel, trebleLevel, speedMultiplier = 1.0) {
        const audioBoost = 1 + audioLevel * 3;
        const bassBoost = 1 + bassLevel * 5;
        const trebleWave = Math.sin(Date.now() * 0.001 + this.angle) * trebleLevel;
        
        this.angle += this.angleSpeed * audioBoost * speedMultiplier;
        this.radius += (bassLevel * 2 - 0.5) * bassBoost * speedMultiplier;
        
        const targetX = this.originX + Math.cos(this.angle) * this.radius * audioBoost;
        const targetY = this.originY + Math.sin(this.angle) * this.radius * audioBoost + this.vy * bassBoost;
        
        this.x += (targetX - this.x) * 0.1 * speedMultiplier + trebleWave * speedMultiplier;
        this.y += (targetY - this.y) * 0.1 * speedMultiplier - Math.abs(trebleWave * speedMultiplier);
        
        this.vy += 0.05 * audioBoost * speedMultiplier;
        this.life -= this.decay * (1 - audioLevel * 0.5) * speedMultiplier;
        
        this.size = Math.max(0.01, this.size + (bassLevel - 0.5) * 0.5);
    }

    draw(ctx, particleOpacity = 0.8) {
        ctx.save();
        ctx.globalAlpha = this.life * particleOpacity;
        
        // Create bokeh feathering effect with radial gradient
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.size * 1.5
        );
        
        // Parse hex color to RGB for gradient manipulation
        const hex = this.color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Create feathered bokeh effect
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);           // Solid center
        gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.8)`);       // Strong middle
        gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.3)`);       // Soft edge
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);           // Transparent outer
        
        ctx.fillStyle = gradient;
        
        // Draw the main bokeh circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Add subtle highlight for bokeh effect (scale down for very small particles)
        if (this.size > 0.05) {
            ctx.globalAlpha = this.life * particleOpacity * 0.5;
            const highlightSize = Math.max(0.1, this.size * 0.8);
            const highlightOffset = Math.max(0.02, this.size * 0.3);
            
            const highlightGradient = ctx.createRadialGradient(
                this.x - highlightOffset, this.y - highlightOffset, 0,
                this.x - highlightOffset, this.y - highlightOffset, highlightSize
            );
            highlightGradient.addColorStop(0, `rgba(255, 255, 255, 0.6)`);
            highlightGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
            
            ctx.fillStyle = highlightGradient;
            ctx.beginPath();
            ctx.arc(this.x - highlightOffset, this.y - highlightOffset, highlightSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
        this.albumArtPosition = { x: 0, y: 0, width: 0, height: 0 };
        
        // Dynamic settings
        this.settings = {
            maxParticles: 200,
            emissionRate: 3,
            particleSize: 1.5,
            decayRate: 0.002,
            trailOpacity: 0.02,
            shadowBlur: 0,
            enableShadows: false,
            enableGlow: true,
            speedMultiplier: 0.05,
            particleOpacity: 0.4,
            blendMode: 'screen',
            canvasBlendMode: 'normal'
        };
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Set initial canvas blend mode (default to normal to ensure background shows)
        this.canvas.style.mixBlendMode = this.settings.canvasBlendMode || 'normal';
        console.log('🎨 Canvas blend mode set to:', this.canvas.style.mixBlendMode);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.updateAlbumArtPosition();
    }

    updateAlbumArtPosition() {
        const minDimension = Math.min(window.innerWidth, window.innerHeight);
        const artSize = minDimension * 0.5;
        this.albumArtPosition = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            width: artSize,
            height: artSize
        };
    }

    setColors(colors) {
        this.colors = colors.length > 0 ? colors : this.colors;
    }

    emit(audioLevel = 0) {
        const emissionBoost = Math.floor(this.settings.emissionRate + audioLevel * this.settings.emissionRate * 4);
        
        for (let i = 0; i < emissionBoost; i++) {
            if (this.particles.length < this.settings.maxParticles) {
                // Emit from multiple points around the album art
                const numEmissionPoints = 8;
                const pointIndex = Math.floor(Math.random() * numEmissionPoints);
                const pointAngle = (Math.PI * 2 / numEmissionPoints) * pointIndex;
                
                const distance = this.albumArtPosition.width / 2 + Math.random() * 30;
                const spread = 0.3;
                const angle = pointAngle + (Math.random() - 0.5) * spread;
                
                const x = this.albumArtPosition.x + Math.cos(angle) * distance;
                const y = this.albumArtPosition.y + Math.sin(angle) * distance;
                
                this.particles.push(new Particle(x, y, this.colors, this.settings));
            }
        }
    }

    update(audioLevel = 0, bassLevel = 0, trebleLevel = 0) {
        this.emit(audioLevel);
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update(audioLevel, bassLevel, trebleLevel, this.settings.speedMultiplier);
            
            if (particle.life <= 0 || 
                particle.x < -50 || particle.x > this.canvas.width + 50 ||
                particle.y < -50 || particle.y > this.canvas.height + 50) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw() {
        // Clear canvas with transparency instead of black overlay
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply blend mode for particles
        this.ctx.save();
        this.ctx.globalCompositeOperation = this.settings.blendMode;
        
        // Legacy glow mode override (for backwards compatibility)
        if (this.settings.enableGlow && this.settings.blendMode === 'source-over') {
            this.ctx.globalCompositeOperation = 'screen';
        }
        
        for (const particle of this.particles) {
            particle.draw(this.ctx, this.settings.particleOpacity);
        }
        
        this.ctx.restore();
        this.ctx.globalCompositeOperation = 'source-over';
    }
    
    updateSettings(newSettings) {
        Object.assign(this.settings, newSettings);
        
        // Update canvas CSS blend mode if it changed
        if (newSettings.canvasBlendMode !== undefined) {
            this.canvas.style.mixBlendMode = newSettings.canvasBlendMode;
            console.log('🎨 Canvas blend mode updated to:', newSettings.canvasBlendMode);
            
            // Temporarily disable blend mode if it's causing issues
            if (newSettings.canvasBlendMode !== 'normal') {
                console.log('⚠️ Non-normal blend mode set, this might affect background visibility');
            }
        }
    }
    
    getParticleCount() {
        return this.particles.length;
    }
}