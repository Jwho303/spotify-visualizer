class Particle {
    constructor(x, y, colors, settings) {
        this.x = x;
        this.y = y;
        this.originX = x;
        this.originY = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2 - 1;
        this.baseSize = settings.particleSize || 2.5;
        this.size = Math.random() * this.baseSize * 1.5 + this.baseSize * 0.5;
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
        
        this.size = Math.max(0.5, this.size + (bassLevel - 0.5) * 0.5);
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life * 0.8;
        ctx.fillStyle = this.color;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
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
            maxParticles: 400,
            emissionRate: 6,
            particleSize: 2.5,
            decayRate: 0.005,
            trailOpacity: 0.08,
            shadowBlur: 0,
            enableShadows: false,
            enableGlow: true,
            speedMultiplier: 1.0
        };
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
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
        this.ctx.fillStyle = `rgba(0, 0, 0, ${this.settings.trailOpacity})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.settings.enableGlow) {
            this.ctx.globalCompositeOperation = 'screen';
        }
        
        for (const particle of this.particles) {
            particle.draw(this.ctx);
        }
        
        this.ctx.globalCompositeOperation = 'source-over';
    }
    
    updateSettings(newSettings) {
        Object.assign(this.settings, newSettings);
    }
    
    getParticleCount() {
        return this.particles.length;
    }
}