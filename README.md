# Spotify Visualizer

A beautiful, interactive music visualizer that creates dynamic particle effects synchronized to your Spotify music, with colors sampled from album artwork and customizable background gradients.

## 🎯 Project Overview & Design Philosophy

This visualizer was designed with several core principles in mind:

### **Aesthetic Intention**
The goal was to create a visual experience that complements music rather than overwhelming it. The particle system uses bokeh-style rendering (inspired by camera lens blur effects) to create soft, dreamy orbs that float and dance with the music. The particles sample colors directly from album artwork, creating a cohesive visual theme that changes with each song.

### **Technical Approach**
- **Pure Vanilla JavaScript**: No frameworks or heavy dependencies - just clean, efficient code
- **Canvas 2D API**: Chosen for broad compatibility and smooth performance
- **Real-time Audio Analysis**: Uses Web Audio API to create truly reactive visuals
- **Color Science**: K-means clustering algorithm extracts dominant colors from album art

### **User Experience**
- **Minimalist Interface**: All controls hidden by default for an immersive experience
- **Keyboard Shortcuts**: Quick access to fullscreen (F) and settings (right-click)
- **Persistent Configuration**: Your perfect settings saved automatically
- **Screen Audio Capture**: Works with headphones by capturing browser tab audio

## ✨ Features

- **🎨 Dynamic Background Gradients** - Automatically generated from album art colors
- **✨ Bokeh Particle Effects** - Customizable particles with realistic blur and highlighting
- **🎵 Audio-Reactive Animation** - Particles respond to music (screen capture or microphone)
- **🎛️ Comprehensive Controls** - Adjust particle count, size, speed, opacity, and blend modes
- **🖱️ Intuitive Interface** - Right-click for settings, F for fullscreen, Escape to exit
- **💾 Configuration System** - Save/load/export your perfect settings
- **🎮 Media Controls** - Play/pause/skip tracks directly from the visualizer
- **📱 Responsive Design** - Works on desktop and mobile devices

## 🚀 Live Demo

Visit: `https://yourusername.github.io/spotify-visualizer`

## 🛠️ Setup for GitHub Pages

### 1. Create Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create an App"
3. Fill in app name and description
4. Note your **Client ID**
5. Add your GitHub Pages URL to **Redirect URIs**:
   - `https://yourusername.github.io/spotify-visualizer/`

### 2. Configure Your Repository

1. Fork or clone this repository
2. Edit `auth.js` and replace `YOUR_SPOTIFY_CLIENT_ID` with your actual Client ID:
   ```javascript
   this.clientId = 'your_actual_client_id_here';
   ```

### 3. Deploy to GitHub Pages

1. Go to your repository **Settings** → **Pages**
2. Select **Deploy from a branch**
3. Choose **main branch** → **/ (root)**
4. Click **Save**

Your visualizer will be available at: `https://yourusername.github.io/repository-name/`

## 🎵 How to Use

### Basic Setup
1. **Open the visualizer** in your browser
2. **Click "Login with Spotify"** and authorize the app
3. **Start playing music** on Spotify (any device)
4. **Enable audio capture** by clicking "🖥️ Enable Screen Audio Capture"

### Audio Capture Options
- **Screen Capture** (Recommended): Captures audio from your Spotify browser tab
- **Microphone**: Uses your device microphone (not ideal with headphones)

### Controls
- **Right-click**: Open/close settings panel
- **F key**: Toggle fullscreen mode
- **Escape**: Exit fullscreen or close settings

### Settings Overview
- **Performance Tab**: Particle count, size, speed, decay, trails
- **Visual Tab**: Media controls and display options
- **Blend Modes**: 
  - Particle Blend: How particles blend with each other
  - Canvas Blend: How particles blend with the background gradient

## 🎨 Recommended Settings

### Ambient Atmosphere
- Particle Size: `1.0-2.0`
- Particle Speed: `0.01-0.05`
- Particle Opacity: `0.3-0.5`
- Canvas Blend Mode: `Soft Light` or `Screen`

### Vibrant Dance
- Particle Size: `2.0-4.0`
- Particle Speed: `0.5-1.0`
- Particle Opacity: `0.7-0.9`
- Canvas Blend Mode: `Color Dodge` or `Overlay`

### Dreamy Bokeh
- Particle Size: `0.5-1.5`
- Particle Speed: `0.001-0.01`
- Particle Opacity: `0.2-0.4`
- Canvas Blend Mode: `Multiply` or `Soft Light`

## 🔧 Technical Details

### Architecture
- **Frontend**: Pure HTML5/CSS3/JavaScript (no frameworks)
- **Authentication**: Spotify Implicit Grant Flow (client-side only)
- **Audio Processing**: Web Audio API with getDisplayMedia()
- **Particle System**: Canvas 2D with custom physics and blending
- **Color Extraction**: K-means clustering on album artwork

### Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Limited support (screen capture may not work)

### Performance Notes
- Optimized for 60 FPS on modern hardware
- Automatic particle count adjustment for performance
- Efficient color sampling and caching

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Spotify Web API for music data
- HTML5 Canvas and Web Audio API
- K-means color clustering algorithm
- Bokeh particle rendering techniques

## 🐛 Troubleshooting

### "Can't connect to Spotify"
- Ensure you've added the correct redirect URI to your Spotify app
- Check that your Client ID is correctly set in `auth.js`

### "No audio detected"
- Try screen capture instead of microphone
- Ensure Spotify is playing in a browser tab
- Check browser permissions for audio access

### "Particles not moving"
- Enable audio capture first
- Try adjusting particle speed settings
- Check that audio levels are showing in the debug panel

### "Background not changing"
- Ensure Canvas Blend Mode is set to "Normal" initially
- Try different blend modes if background appears black
- Check browser console for any errors

## 🏗️ Architecture & Code Structure

### **Core Components**

#### **Authentication (`auth-pkce.js`)**
Implements Spotify's Authorization Code Flow with PKCE (Proof Key for Code Exchange). This was necessary after Spotify deprecated the Implicit Grant Flow. The implementation:
- Generates cryptographically secure code verifiers
- Handles OAuth 2.0 flow entirely client-side
- Manages token refresh automatically
- Stores tokens securely in localStorage

#### **Main Application (`app-github.js`)**
The orchestrator that ties everything together:
- Initializes all subsystems in correct order
- Manages authentication state and UI updates
- Handles user interactions and keyboard shortcuts
- Coordinates particle system with audio analysis

#### **Particle System (`particles.js`)**
The heart of the visual experience:
- **Particle Physics**: Each particle has position, velocity, decay, and size properties
- **Bokeh Rendering**: Uses radial gradients with feathered edges for realistic blur
- **Audio Reactivity**: Particles respond to bass (movement), treble (shimmer), and overall volume
- **Emission System**: Particles emit from behind album art in controlled patterns

#### **Audio Analysis (`audioAnalyzer.js`)**
Captures and processes audio in real-time:
- **Screen Capture**: Uses `getDisplayMedia()` API to capture tab audio
- **Frequency Analysis**: Fast Fourier Transform splits audio into frequency bands
- **Level Detection**: Separate analysis for bass (20-250Hz), mids (250-2000Hz), and treble (2000-20000Hz)
- **Fallback Mode**: Synthetic audio waves when no input available

#### **Color Extraction (`colorThief.js`)**
Intelligent color palette generation:
- **K-means Clustering**: Groups similar pixels to find dominant colors
- **Smart Filtering**: Ignores pure black/white for better results
- **Dual Output**: Bright colors for particles, muted colors for background
- **Background Generation**: Creates darkened gradients (15-30% brightness) for subtle backgrounds

#### **Configuration System (`configManager.js`)**
Persistent settings management:
- **LocalStorage Backend**: Saves settings automatically
- **Export/Import**: Share configurations as JSON files
- **Default Merging**: New settings added seamlessly on updates

### **Design Decisions**

#### **Why Canvas 2D instead of WebGL?**
- Better browser compatibility
- Simpler codebase to maintain
- Sufficient performance for particle count
- Easier blend mode implementation

#### **Why Screen Capture for Audio?**
- Spotify's DRM prevents direct audio access
- Works perfectly with headphones
- Captures exact audio output
- No microphone feedback issues

#### **Why K-means for Color Extraction?**
- Finds perceptually dominant colors
- Handles gradients and complex artwork
- Fast enough for real-time updates
- Better than simple averaging

### **Performance Optimizations**

1. **Particle Pooling**: Reuses particle objects to reduce garbage collection
2. **Conditional Rendering**: Only updates changed elements
3. **RAF Throttling**: Locked to browser refresh rate
4. **Canvas Clearing**: Uses `clearRect()` instead of fillRect for transparency
5. **Batch Operations**: Groups similar draw calls

### **Security Considerations**

- **No Client Secret**: Uses PKCE flow to avoid exposing secrets
- **Token Handling**: Access tokens never logged or exposed
- **Domain Validation**: Spotify validates redirect URIs
- **Minimal Permissions**: Only requests necessary scopes

## 🎨 Visual Design Philosophy

The visualizer aims to create an atmosphere rather than a light show. Key principles:

1. **Subtlety Over Spectacle**: Default settings favor slow, graceful movement
2. **Color Harmony**: Particles and background derive from same source
3. **Bokeh Aesthetic**: Soft, out-of-focus orbs create depth
4. **Musical Responsiveness**: React to music structure, not just volume

The particle system uses multiple blend modes:
- **Particle-to-Particle**: How particles interact with each other
- **Canvas-to-Background**: How entire particle layer blends with gradient

This dual-layer blending creates rich, complex visuals while maintaining performance.

## 🙏 Credits & Inspiration

- **Spotify Web API**: For providing rich music metadata
- **Web Audio API**: For making browser-based audio analysis possible
- **Processing/p5.js Community**: For particle system inspiration
- **Photography Community**: For bokeh rendering techniques

## 📝 Future Enhancements

Potential areas for expansion:
- **3D Particles**: WebGL implementation for depth effects
- **Waveform Display**: Show audio waveform alongside particles
- **Preset System**: Save/share complete visual configurations
- **Mobile Support**: Touch controls and responsive design
- **Social Features**: Share visualizations as videos

---

Made with ❤️ for music lovers and visual enthusiasts

The code is open source and designed to be readable, maintainable, and extensible. Feel free to fork, modify, and make it your own!
