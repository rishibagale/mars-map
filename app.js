// Three.js Scene Setup
let scene, camera, renderer, controls;
let marsMesh, regionMarkers = [], satelliteObjects = [];
let selectedRegion = null, selectedSatellite = null;
let animationRunning = true;
let lastUpdateTime = Date.now();

// Initialize the application
function init() {
    // Create scene with pure black background (like reference images)
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = null; // No fog for clarity

    // Create camera
    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        10000
    );
    camera.position.set(0, 0, 15);

    // Create renderer with performance optimizations and high quality
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        powerPreference: "high-performance",
        alpha: false,
        stencil: false,
        depth: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    renderer.shadowMap.enabled = false; // Disable shadows for performance
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Professional lighting setup matching reference images
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Main directional light (simulating Sun) - from upper left like reference images
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(10, 8, 5);
    directionalLight.castShadow = false;
    scene.add(directionalLight);

    // Secondary light for fill (reduces harsh shadows)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 2, -3);
    scene.add(fillLight);

    // Hemisphere light for atmospheric effect
    const hemiLight = new THREE.HemisphereLight(0xff6b35, 0x4a4a4a, 0.2);
    scene.add(hemiLight);

    // Create Mars
    createMars();

    // Add stars background
    createStarField();

    // Create region markers
    createRegionMarkers();

    // Create satellites
    createSatellites();

    // Setup controls
    setupControls();

    // Setup UI
    setupUI();

    // Start animation loop
    animate();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

// Create realistic Mars texture
function createMarsTexture() {
    const canvas = document.createElement('canvas');
    // Use 1024 for better performance while maintaining quality
    const size = 1024; // High resolution for professional look
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Base Mars colors - realistic reddish-orange matching reference images
    const baseColor = { r: 200, g: 100, b: 80 }; // Realistic Mars reddish-orange
    const darkColor = { r: 90, g: 45, b: 40 }; // Darker volcanic plains/basalt
    const lightColor = { r: 230, g: 140, b: 110 }; // Lighter dusty/ochre regions
    const craterColor = { r: 70, g: 35, b: 30 }; // Deep craters
    
    // Create base color
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;
    
    // Generate realistic Mars surface
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const index = (y * size + x) * 4;
            
            // Convert to spherical coordinates for realistic mapping
            const u = x / size;
            const v = y / size;
            const lat = (v - 0.5) * Math.PI;
            const lon = u * Math.PI * 2;
            
            // Multiple noise layers for realistic surface
            let noise1 = Math.sin(lon * 3) * Math.cos(lat * 4) * 0.3;
            let noise2 = Math.sin(lon * 7) * Math.cos(lat * 5) * 0.2;
            let noise3 = Math.sin(lon * 15) * Math.cos(lat * 12) * 0.15;
            let noise4 = Math.sin(lon * 25) * Math.cos(lat * 20) * 0.1;
            
            const combinedNoise = noise1 + noise2 + noise3 + noise4;
            
            // Create crater-like features
            const craterNoise = Math.sin(lon * 50) * Math.cos(lat * 50);
            const craterMask = craterNoise > 0.7 ? 0.3 : 1.0;
            
            // Create darker patches (volcanic plains)
            const darkPatch = Math.sin(lon * 2.3) * Math.cos(lat * 1.7);
            const isDarkRegion = darkPatch < -0.3;
            
            // Create lighter dusty regions
            const lightPatch = Math.sin(lon * 1.5) * Math.cos(lat * 2.1);
            const isLightRegion = lightPatch > 0.4;
            
            // Determine final color
            let r, g, b;
            
            if (isDarkRegion) {
                // Darker volcanic plains
                const blend = (combinedNoise + 1) * 0.5;
                r = baseColor.r * 0.6 + darkColor.r * 0.4;
                g = baseColor.g * 0.6 + darkColor.g * 0.4;
                b = baseColor.b * 0.6 + darkColor.b * 0.4;
            } else if (isLightRegion) {
                // Lighter dusty regions
                r = baseColor.r * 0.8 + lightColor.r * 0.2;
                g = baseColor.g * 0.8 + lightColor.g * 0.2;
                b = baseColor.b * 0.8 + lightColor.b * 0.2;
            } else {
                // Base Mars color with variation
                const variation = (combinedNoise + 1) * 0.5;
                r = baseColor.r * (0.7 + variation * 0.3);
                g = baseColor.g * (0.7 + variation * 0.3);
                b = baseColor.b * (0.7 + variation * 0.3);
            }
            
            // Apply crater darkening
            r *= craterMask;
            g *= craterMask;
            b *= craterMask;
            
            // Add subtle color variation for realism
            const colorVariation = (Math.sin(x * 0.1) + Math.cos(y * 0.1)) * 0.05;
            r = Math.max(60, Math.min(255, r + colorVariation * 20));
            g = Math.max(40, Math.min(150, g + colorVariation * 15));
            b = Math.max(40, Math.min(120, b + colorVariation * 10));
            
            data[index] = r;     // R
            data[index + 1] = g; // G
            data[index + 2] = b; // B
            data[index + 3] = 255; // A
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Create bump map for surface detail (craters and topography)
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = size;
    bumpCanvas.height = size;
    const bumpCtx = bumpCanvas.getContext('2d');
    const bumpData = bumpCtx.createImageData(size, size);
    
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const index = (y * size + x) * 4;
            const u = x / size;
            const v = y / size;
            const lat = (v - 0.5) * Math.PI;
            const lon = u * Math.PI * 2;
            
            // Create bump map for surface relief (craters, mountains)
            const bump1 = Math.sin(lon * 8) * Math.cos(lat * 6) * 0.4;
            const bump2 = Math.sin(lon * 18) * Math.cos(lat * 14) * 0.3;
            const bump3 = Math.sin(lon * 35) * Math.cos(lat * 28) * 0.2;
            const bump4 = Math.sin(lon * 60) * Math.cos(lat * 50) * 0.15; // Small craters
            const bump = (bump1 + bump2 + bump3 + bump4 + 1) * 0.5;
            
            const gray = Math.floor(bump * 255);
            bumpData.data[index] = gray;
            bumpData.data[index + 1] = gray;
            bumpData.data[index + 2] = gray;
            bumpData.data[index + 3] = 255;
        }
    }
    
    bumpCtx.putImageData(bumpData, 0, 0);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    if (renderer && renderer.capabilities) {
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    } else {
        texture.anisotropy = 16; // Fallback value
    }
    texture.generateMipmaps = true;
    
    const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
    bumpTexture.wrapS = THREE.RepeatWrapping;
    bumpTexture.wrapT = THREE.RepeatWrapping;
    bumpTexture.generateMipmaps = true;
    
    return { texture, bumpTexture };
}

// Create Mars sphere
function createMars() {
    // Higher resolution geometry for smoother, more professional look
    const geometry = new THREE.SphereGeometry(5, 128, 128);
    
    // Generate realistic Mars textures
    const { texture, bumpTexture } = createMarsTexture();
    
    // Create realistic Mars material with proper shading
    const material = new THREE.MeshPhongMaterial({
        map: texture,
        bumpMap: bumpTexture,
        bumpScale: 0.4, // Increased for more visible surface detail
        shininess: 5, // Low shininess for matte surface
        specular: new THREE.Color(0x1a1a1a), // Very subtle specular
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 0,
        side: THREE.FrontSide
    });

    marsMesh = new THREE.Mesh(geometry, material);
    scene.add(marsMesh);
}

// Create professional star field background
function createStarField() {
    const starsGeometry = new THREE.BufferGeometry();
    
    // More realistic star material with varying sizes
    const starsMaterial = new THREE.PointsMaterial({ 
        color: 0xffffff, 
        size: 0.15,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.8
    });

    const starsVertices = [];
    const starsColors = [];
    
    // Create more stars for professional look
    for (let i = 0; i < 15000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starsVertices.push(x, y, z);
        
        // Vary star colors slightly for realism
        const brightness = 0.7 + Math.random() * 0.3;
        starsColors.push(brightness, brightness, brightness);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starsColors, 3));
    starsMaterial.vertexColors = true;
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

// Convert lat/lon to 3D coordinates on sphere
function latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));

    return new THREE.Vector3(x, y, z);
}

// Create markers for Mars regions
function createRegionMarkers() {
    marsRegions.forEach((region, index) => {
        const position = latLonToVector3(region.coordinates.lat, region.coordinates.lon, 5.1);
        
        // Create marker geometry
        const markerGeometry = new THREE.ConeGeometry(0.15, 0.5, 8);
        const markerMaterial = new THREE.MeshBasicMaterial({ 
            color: region.color || 0xff0000,
            transparent: true,
            opacity: 0.8
        });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.copy(position);
        marker.lookAt(0, 0, 0); // Point towards center
        marker.rotateX(Math.PI / 2);
        marker.userData = { type: 'region', data: region };
        
        // Add label
        const labelGeometry = new THREE.RingGeometry(0.2, 0.25, 16);
        const labelMaterial = new THREE.MeshBasicMaterial({ 
            color: region.color || 0xff0000,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.copy(position);
        label.scale.multiplyScalar(1.2);
        label.lookAt(camera.position);
        marker.add(label);

        scene.add(marker);
        regionMarkers.push(marker);
    });
}

// Create satellite objects with orbital paths
function createSatellites() {
    marsSatellites.forEach((satellite, index) => {
        if (satellite.altitude === 0) return; // Skip surface rovers for orbital display

        const radius = 5 + (satellite.altitude / 1000); // Scale altitude
        const angle = (index * Math.PI * 2) / marsSatellites.length;

        // Create satellite sphere
        const satGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const satMaterial = new THREE.MeshBasicMaterial({ 
            color: satellite.color || 0xffff00,
            emissive: satellite.color || 0xffff00,
            emissiveIntensity: 0.8
        });
        const satMesh = new THREE.Mesh(satGeometry, satMaterial);
        
        // Create orbital path
        const orbitCurve = new THREE.EllipseCurve(
            0, 0,
            radius * (1 + satellite.eccentricity), radius * (1 - satellite.eccentricity),
            0, 2 * Math.PI,
            false,
            0
        );
        const orbitPoints = orbitCurve.getPoints(100);
        const orbitGeometry = new THREE.BufferGeometry().setFromPoints(
            orbitPoints.map(p => {
                const angle = Math.atan2(p.y, p.x);
                const r = Math.sqrt(p.x * p.x + p.y * p.y);
                return new THREE.Vector3(
                    r * Math.cos(angle + satellite.raan * Math.PI / 180),
                    r * Math.sin(angle + satellite.raan * Math.PI / 180) * Math.cos(satellite.inclination * Math.PI / 180),
                    r * Math.sin(angle + satellite.raan * Math.PI / 180) * Math.sin(satellite.inclination * Math.PI / 180)
                );
            })
        );
        const orbitMaterial = new THREE.LineBasicMaterial({ 
            color: satellite.color || 0xffff00,
            transparent: true,
            opacity: 0.3
        });
        const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
        scene.add(orbitLine);

        satMesh.userData = { 
            type: 'satellite', 
            data: satellite,
            radius: radius,
            angle: angle,
            speed: satellite.speed / 100, // Normalized speed
            period: satellite.period
        };

        scene.add(satMesh);
        satelliteObjects.push(satMesh);
    });
}

// Setup orbit controls
function setupControls() {
    // Simple custom orbit controls for smooth Mars navigation
    controls = {
        target: new THREE.Vector3(0, 0, 0),
        minDistance: 6,
        maxDistance: 50,
        enableDamping: true,
        dampingFactor: 0.05,
        enablePan: false,
        autoRotate: false,
        autoRotateSpeed: 0.5,
        
        spherical: new THREE.Spherical(),
        sphericalDelta: new THREE.Spherical(),
        scale: 1,
        
        update: function() {
            const offset = new THREE.Vector3();
            offset.copy(camera.position).sub(this.target);
            this.spherical.setFromVector3(offset);
            
            // Apply deltas
            this.spherical.theta += this.sphericalDelta.theta;
            this.spherical.phi += this.sphericalDelta.phi;
            
            // Clamp phi to prevent flipping
            this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi));
            
            // Apply zoom scale
            this.spherical.radius *= this.scale;
            this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));
            
            // Update camera position
            offset.setFromSpherical(this.spherical);
            camera.position.copy(this.target).add(offset);
            camera.lookAt(this.target);
            
            // Apply damping
            if (this.enableDamping) {
                this.sphericalDelta.theta *= (1 - this.dampingFactor);
                this.sphericalDelta.phi *= (1 - this.dampingFactor);
            } else {
                this.sphericalDelta.set(0, 0, 0);
            }
            this.scale = 1;
        }
    };
    
    // Initialize spherical coordinates
    const offset = new THREE.Vector3();
    offset.copy(camera.position).sub(controls.target);
    controls.spherical.setFromVector3(offset);
    
    // Mouse controls
    let isMouseDown = false;
    let lastMouseX = 0, lastMouseY = 0;
    
    renderer.domElement.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // Left mouse button
            isMouseDown = true;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        }
    });
    
    renderer.domElement.addEventListener('mousemove', (e) => {
        if (!isMouseDown) return;
        
        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;
        
        controls.sphericalDelta.theta -= deltaX * 0.01;
        controls.sphericalDelta.phi -= deltaY * 0.01;
        
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });
    
    renderer.domElement.addEventListener('mouseup', () => {
        isMouseDown = false;
    });
    
    renderer.domElement.addEventListener('mouseleave', () => {
        isMouseDown = false;
    });
    
    renderer.domElement.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomSpeed = 0.05;
        if (e.deltaY > 0) {
            controls.scale = 1 + zoomSpeed;
        } else {
            controls.scale = 1 - zoomSpeed;
        }
    });
    
    renderer.domElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
}

// Setup UI event listeners
function setupUI() {
    // Region search and load
    document.getElementById('loadRegion').addEventListener('click', () => {
        const searchValue = document.getElementById('regionSearch').value.toLowerCase();
        const region = marsRegions.find(r => 
            r.name.toLowerCase().includes(searchValue) || 
            r.id.toLowerCase().includes(searchValue)
        );
        if (region) {
            selectRegion(region);
        }
    });

    // Satellite search and load
    document.getElementById('loadSatellite').addEventListener('click', () => {
        const searchValue = document.getElementById('satelliteSearch').value.toLowerCase();
        const satellite = marsSatellites.find(s => 
            s.name.toLowerCase().includes(searchValue) || 
            s.noradId.toLowerCase().includes(searchValue)
        );
        if (satellite) {
            selectSatellite(satellite);
        }
    });

    // Run simulation button
    document.getElementById('runSimulation').addEventListener('click', () => {
        animationRunning = !animationRunning;
        document.getElementById('statusValue').textContent = animationRunning ? 'ACTIVE' : 'PAUSED';
        document.getElementById('statusValue').style.color = animationRunning ? '#4ade80' : '#ef4444';
    });

    // Populate regions list
    const regionsList = document.getElementById('regionsList');
    marsRegions.forEach(region => {
        const item = document.createElement('div');
        item.className = 'region-item';
        item.innerHTML = `
            <div class="item-name">${region.name}</div>
            <div class="item-info">${region.type}</div>
        `;
        item.addEventListener('click', () => selectRegion(region));
        regionsList.appendChild(item);
    });

    // Populate satellites list
    const satellitesList = document.getElementById('satellitesList');
    marsSatellites.forEach(satellite => {
        const item = document.createElement('div');
        item.className = 'satellite-item';
        item.innerHTML = `
            <div class="item-name">${satellite.name}</div>
            <div class="item-info">${satellite.orbitClass} • Alt: ${satellite.altitude}km</div>
        `;
        item.addEventListener('click', () => selectSatellite(satellite));
        satellitesList.appendChild(item);
    });

    // Raycasting for mouse interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    renderer.domElement.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects([...regionMarkers, ...satelliteObjects]);

        if (intersects.length > 0) {
            const obj = intersects[0].object;
            if (obj.userData.type === 'region') {
                document.getElementById('hoverInfo').textContent = obj.userData.data.name;
            } else if (obj.userData.type === 'satellite') {
                document.getElementById('hoverInfo').textContent = obj.userData.data.name;
            }
        } else {
            document.getElementById('hoverInfo').textContent = 'Hover over regions or satellites for details';
        }
    });

    renderer.domElement.addEventListener('click', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects([...regionMarkers, ...satelliteObjects]);

        if (intersects.length > 0) {
            const obj = intersects[0].object;
            if (obj.userData.type === 'region') {
                selectRegion(obj.userData.data);
            } else if (obj.userData.type === 'satellite') {
                selectSatellite(obj.userData.data);
            }
        }
    });
}

// Select and display region details
function selectRegion(region) {
    selectedRegion = region;
    
    // Update UI
    const detailsDiv = document.getElementById('regionDetails');
    detailsDiv.innerHTML = `
        <div class="detail-item">
            <span class="detail-label">Name:</span>
            <span class="detail-value">${region.name}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Type:</span>
            <span class="detail-value">${region.type}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Mass:</span>
            <span class="detail-value">${region.mass}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Diameter:</span>
            <span class="detail-value">${region.diameter}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Atmosphere:</span>
            <span class="detail-value">${region.atmosphere}</span>
        </div>
        ${region.height ? `
        <div class="detail-item">
            <span class="detail-label">Height:</span>
            <span class="detail-value">${region.height}</span>
        </div>
        ` : ''}
        ${region.depth ? `
        <div class="detail-item">
            <span class="detail-label">Depth:</span>
            <span class="detail-value">${region.depth}</span>
        </div>
        ` : ''}
        <div class="detail-item">
            <span class="detail-label">Description:</span>
            <span class="detail-value">${region.description}</span>
        </div>
    `;

    // Highlight marker
    regionMarkers.forEach((marker, index) => {
        if (marsRegions[index].id === region.id) {
            marker.scale.set(1.5, 1.5, 1.5);
            marker.material.opacity = 1;
        } else {
            marker.scale.set(1, 1, 1);
            marker.material.opacity = 0.8;
        }
    });

    // Update list items
    document.querySelectorAll('.region-item').forEach((item, index) => {
        if (marsRegions[index].id === region.id) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Fly to region
    const position = latLonToVector3(region.coordinates.lat, region.coordinates.lon, 8);
    animateCameraTo(position);
}

// Select and display satellite details
function selectSatellite(satellite) {
    selectedSatellite = satellite;
    
    // Update UI
    const detailsDiv = document.getElementById('satelliteDetails');
    detailsDiv.innerHTML = `
        <div class="detail-item">
            <span class="detail-label">Name:</span>
            <span class="detail-value">${satellite.name}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">NORAD ID:</span>
            <span class="detail-value">${satellite.noradId}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Orbit Class:</span>
            <span class="detail-value">${satellite.orbitClass}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Altitude:</span>
            <span class="detail-value">${satellite.altitude} km</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Speed:</span>
            <span class="detail-value">${satellite.speed} km/s</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Inclination:</span>
            <span class="detail-value">${satellite.inclination}°</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Period:</span>
            <span class="detail-value">${satellite.period} days</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Mass:</span>
            <span class="detail-value">${satellite.mass}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Size:</span>
            <span class="detail-value">${satellite.diameter}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Description:</span>
            <span class="detail-value">${satellite.description}</span>
        </div>
    `;

    // Highlight satellite
    satelliteObjects.forEach((obj, index) => {
        if (marsSatellites[index].id === satellite.id) {
            obj.scale.set(2, 2, 2);
        } else {
            obj.scale.set(1, 1, 1);
        }
    });

    // Update list items
    document.querySelectorAll('.satellite-item').forEach((item, index) => {
        if (marsSatellites[index].id === satellite.id) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Animate camera to position
function animateCameraTo(targetPosition) {
    const startPosition = camera.position.clone();
    const duration = 1000; // ms
    const startTime = Date.now();

    function updateCamera() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic

        camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
        controls.update();

        if (progress < 1) {
            requestAnimationFrame(updateCamera);
        }
    }
    updateCamera();
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (animationRunning) {
        // Update satellite positions
        const time = Date.now() * 0.0001;
        satelliteObjects.forEach((sat, index) => {
            const data = sat.userData;
            const angle = data.angle + (time * data.speed);
            
            sat.position.x = data.radius * Math.cos(angle);
            sat.position.y = data.radius * Math.sin(angle) * Math.cos(data.data.inclination * Math.PI / 180);
            sat.position.z = data.radius * Math.sin(angle) * Math.sin(data.data.inclination * Math.PI / 180);
        });

        // Rotate Mars slowly
        if (marsMesh) {
            marsMesh.rotation.y += 0.0005;
        }
    }

    controls.update();
    renderer.render(scene, camera);

    // Update timestamp
    const now = Date.now();
    if (now - lastUpdateTime > 1000) {
        const date = new Date();
        document.getElementById('lastUpdated').textContent = 
            `Last updated: ${date.toLocaleTimeString()}`;
        lastUpdateTime = now;
    }
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Initialize when page loads
window.addEventListener('load', init);
