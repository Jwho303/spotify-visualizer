class ColorExtractor {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    async extractColors(imageUrl, numColors = 5) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            
            img.onload = () => {
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                this.ctx.drawImage(img, 0, 0);
                
                try {
                    const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
                    const pixels = imageData.data;
                    const colors = this.getPalette(pixels, numColors);
                    
                    const hexColors = colors.map(rgb => this.rgbToHex(rgb[0], rgb[1], rgb[2]));
                    resolve(hexColors);
                } catch (error) {
                    console.error('Error extracting colors:', error);
                    resolve(['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8']);
                }
            };
            
            img.onerror = () => {
                console.error('Error loading image for color extraction');
                resolve(['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8']);
            };
            
            img.src = imageUrl;
        });
    }

    getPalette(pixels, numColors) {
        const pixelArray = [];
        
        for (let i = 0; i < pixels.length; i += 4 * 10) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];
            
            if (a >= 125) {
                if (!(r > 250 && g > 250 && b > 250) && !(r < 10 && g < 10 && b < 10)) {
                    pixelArray.push([r, g, b]);
                }
            }
        }
        
        const clusters = this.kMeans(pixelArray, numColors);
        
        const vibrantClusters = clusters.map(cluster => {
            const [r, g, b] = cluster;
            const saturation = 1.3;
            const brightness = 1.2;
            
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;
            
            let newR = r;
            let newG = g;
            let newB = b;
            
            if (delta > 0) {
                const mid = (max + min) / 2;
                newR = mid + (r - mid) * saturation;
                newG = mid + (g - mid) * saturation;
                newB = mid + (b - mid) * saturation;
            }
            
            newR = Math.min(255, newR * brightness);
            newG = Math.min(255, newG * brightness);
            newB = Math.min(255, newB * brightness);
            
            return [Math.round(newR), Math.round(newG), Math.round(newB)];
        });
        
        return vibrantClusters;
    }

    kMeans(points, k) {
        if (points.length < k) {
            return points;
        }
        
        let centroids = [];
        for (let i = 0; i < k; i++) {
            centroids.push(points[Math.floor(Math.random() * points.length)]);
        }
        
        let clusters;
        let lastCentroids;
        let iterations = 0;
        const maxIterations = 20;
        
        do {
            clusters = Array(k).fill(null).map(() => []);
            
            for (const point of points) {
                let minDist = Infinity;
                let closestCentroid = 0;
                
                for (let i = 0; i < centroids.length; i++) {
                    const dist = this.distance(point, centroids[i]);
                    if (dist < minDist) {
                        minDist = dist;
                        closestCentroid = i;
                    }
                }
                
                clusters[closestCentroid].push(point);
            }
            
            lastCentroids = centroids;
            centroids = clusters.map(cluster => {
                if (cluster.length === 0) return lastCentroids[0];
                return this.average(cluster);
            });
            
            iterations++;
        } while (!this.converged(centroids, lastCentroids) && iterations < maxIterations);
        
        return centroids;
    }

    distance(a, b) {
        return Math.sqrt(
            Math.pow(a[0] - b[0], 2) +
            Math.pow(a[1] - b[1], 2) +
            Math.pow(a[2] - b[2], 2)
        );
    }

    average(points) {
        const sum = points.reduce((acc, point) => {
            return [acc[0] + point[0], acc[1] + point[1], acc[2] + point[2]];
        }, [0, 0, 0]);
        
        return [
            Math.round(sum[0] / points.length),
            Math.round(sum[1] / points.length),
            Math.round(sum[2] / points.length)
        ];
    }

    converged(centroids, lastCentroids) {
        for (let i = 0; i < centroids.length; i++) {
            if (this.distance(centroids[i], lastCentroids[i]) > 1) {
                return false;
            }
        }
        return true;
    }

    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }
}