// 1. Project Setup: Initialize CesiumJS for Mars

// IMPORTANT: Replace this with your actual Cesium Ion Access Token
Cesium.Ion.defaultAccessToken = 'YOUR_CESIUM_ION_TOKEN';

// Initialize the Cesium Viewer in the HTML element with id "cesiumContainer"
const viewer = new Cesium.Viewer('cesiumContainer', {
    // Disable default widgets that are less relevant for a raw Mars view
    baseLayerPicker: false, // We will set our own base layer
    geocoder: false,        // Earth geocoder isn't useful for Mars
    homeButton: false,      // We'll implement custom navigation if needed
    sceneModePicker: false,
    navigationHelpButton: false,
    animation: false,       // Hide animation timeline
    timeline: false,
    // Use Mars Ellipsoid (standard setup)
    globe: new Cesium.Globe(Cesium.Ellipsoid.MARS),
    skyAtmosphere: new Cesium.SkyAtmosphere(Cesium.Ellipsoid.MARS)
});

// Remove the default Earth imagery (Bing Maps) if it loaded
viewer.imageryLayers.removeAll();

// 2. Realistic Mars Surface: Add a base Mars Imagery Layer
// We can use a standard Mars WMS or a specific Ion asset if available.
// For now, we will use a solid color or a basic texture until we set up the high-res one.
// Let's use a placeholder TileMapService or a simple color for the base to ensure it works.
// A common free fallback is the TileMapServiceImageryProvider if you have local tiles, 
// but here we will try to load a standard Mars texture if possible, or leave it blank/default color.

// Setting the scene background to black for space
viewer.scene.skyBox.show = true; // Use default starfield
viewer.scene.backgroundColor = Cesium.Color.BLACK;

console.log("Cesium Configured for Mars.");

// Camera settings will be adjusted in later steps to ensure we are looking at Mars behavior.
viewer.scene.screenSpaceCameraController.enableCollisionDetection = true;
