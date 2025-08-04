# Spotify Visualizer

A beautiful, interactive music visualizer that creates dynamic particle effects synchronized to your Spotify music, with colors sampled from album artwork and customizable background gradients.

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

---

Made with ❤️ for music lovers and visual enthusiasts
