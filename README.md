# Mars 3D Explorer

An interactive 3D visualization of Mars with detailed region information and satellite orbital simulation. Built with Three.js for smooth, Google Earth-like navigation.

## Features

- **3D Mars Model**: Interactive 3D representation of Mars with smooth rotation
- **Mars Regions**: Explore 8 major regions including:
  - Olympus Mons (largest volcano in the solar system)
  - Valles Marineris (largest canyon system)
  - Hellas Planitia (impact basin)
  - Tharsis Rise (volcanic plateau)
  - North & South Polar Caps
  - Gale Crater & Jezero Crater (rover landing sites)
- **Region Details**: View mass, diameter, atmosphere, height/depth, and descriptions for each region
- **Satellite Simulation**: Real-time visualization of satellites orbiting Mars:
  - Phobos & Deimos (Mars's moons)
  - Mars Express
  - Mars Reconnaissance Orbiter
  - Mars Odyssey
  - MAVEN
  - Trace Gas Orbiter
  - Mars 2020 (Perseverance rover)
- **Smooth Navigation**: Google Earth-like controls with zoom, rotate, and pan
- **Modern UI**: Dark theme with side panels for data display
- **Interactive Selection**: Click or hover over regions and satellites to view details

## Getting Started

### Option 1: Direct Browser Access

Simply open `index.html` in a modern web browser. All dependencies are loaded from CDN.

### Option 2: Local Server (Recommended)

For best performance, run a local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## Controls

- **Left Mouse Button + Drag**: Rotate the view around Mars
- **Right Mouse Button + Drag**: Pan the view
- **Mouse Wheel**: Zoom in/out
- **Click on Markers**: Select regions or satellites to view details
- **Hover**: See names of regions and satellites

## Performance Tips

- The application is optimized for smooth performance with:
  - Limited pixel ratio to prevent excessive rendering
  - Efficient WebGL rendering
  - Optimized orbital calculations
- For best performance, use a modern browser with WebGL support (Chrome, Firefox, Edge, Safari)

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

Requires WebGL support.

## Project Structure

```
├── index.html          # Main HTML file
├── styles.css          # Styling and UI
├── app.js              # Main application logic and 3D rendering
├── marsData.js         # Mars regions and satellites data
├── orbitControls.js    # Camera controls for navigation
└── README.md           # This file
```

## Customization

### Adding New Regions

Edit `marsData.js` and add entries to the `marsRegions` array:

```javascript
{
    id: 'region-id',
    name: 'Region Name',
    type: 'Type',
    coordinates: { lat: 0, lon: 0 },
    mass: 'Mass value',
    diameter: 'Diameter value',
    atmosphere: 'Atmosphere description',
    description: 'Region description',
    color: '#HEXCOLOR'
}
```

### Adding New Satellites

Edit `marsData.js` and add entries to the `marsSatellites` array:

```javascript
{
    id: 'satellite-id',
    name: 'Satellite Name',
    noradId: 'NORAD-ID',
    orbitClass: 'Orbit Class',
    altitude: 400, // km
    speed: 3.4, // km/s
    inclination: 93.0, // degrees
    period: 0.088, // days
    mass: 'Mass value',
    diameter: 'Size',
    description: 'Description',
    color: '#HEXCOLOR',
    raan: 0,
    eccentricity: 0.0
}
```

## License

This project is open source and available for educational and personal use.

## Credits

- Three.js for 3D rendering
- Data based on NASA and ESA mission information
