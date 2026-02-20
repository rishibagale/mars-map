// Google Mars 3D - Three.js Setup
let scene, camera, renderer, controls;
let marsMesh, atmosphereMesh;
let regionMarkers = [], satelliteObjects = [];
let selectedTarget = null;
let animationRunning = true;
let autoRotation = true;
let lastUpdateTime = Date.now();

// DOM Elements
const labelsContainer = document.getElementById('labels-container');
const infoCard = document.getElementById('infoCard');
const sidebar = document.getElementById('mainSidebar');

// Initialize the application
function init() {
    // Canvas container
    const container = document.getElementById('canvas-container');

    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Starry background

    // Create camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(0, 0, 18); // Start slightly further out

    // Renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
        alpha: false
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputEncoding = THREE.sRGBEncoding; // Better color accuracy for PBR
    container.appendChild(renderer.domElement);

    // Lighting (High Contrast PBR setup)
    const sunLight = new THREE.DirectionalLight(0xffffff, 3.0); // Very bright sun (increased from 2.5)
    sunLight.position.set(20, 10, 10);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.05); // Deep shadows (decreased from 0.15)
    scene.add(ambientLight);

    const backLight = new THREE.DirectionalLight(0xc1440e, 0.5); // Rim light
    backLight.position.set(-10, 0, -20);
    scene.add(backLight);

    // Create World
    createMars();
    createStarField();

    // Create Markers & Satellites
    createRegionLabels();
    createSatellites();

    // Setup Custom Orbit Controls
    setupControls();

    // UI Setup
    setupUI();

    // Animation Loop
    animate();

    // Resize Handle
    window.addEventListener('resize', onWindowResize);
}

// Create Mars with PBR Material
function createMars() {
    const geometry = new THREE.SphereGeometry(5, 256, 256); // Higher poly for bump detail
    const { texture, bumpTexture, roughness, metalness } = createMarsTexture();

    const material = new THREE.MeshStandardMaterial({
        map: texture,
        bumpMap: bumpTexture,
        bumpScale: 0.5, // Significant bump for craters
        roughnessMap: roughness, // Varying roughness (ice is shiny, dust is matte)
        metalness: 0.0,
        color: 0xffffff
    });

    marsMesh = new THREE.Mesh(geometry, material);
    scene.add(marsMesh);

    // Atmosphere Glow (Sprite)
    const spriteMaterial = new THREE.SpriteMaterial({
        map: createGlowTexture(),
        color: 0xffa07a, // Light Salmon/Dusty
        transparent: true,
        opacity: 0.25, // Subtle
        blending: THREE.AdditiveBlending
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(12.8, 12.8, 1.0);
    scene.add(sprite);
    atmosphereMesh = sprite;

    // Cloud Layer
    const cloudGeometry = new THREE.SphereGeometry(5.05, 64, 64);
    const cloudMaterial = new THREE.MeshStandardMaterial({
        map: createCloudTexture(),
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
    });
    atmosphereMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    scene.add(atmosphereMesh);
}

// Procedural Mars Textures with Explicit Craters
function createMarsTexture() {
    const size = 2048;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = size;
    bumpCanvas.height = size;
    const bumpCtx = bumpCanvas.getContext('2d');

    const roughCanvas = document.createElement('canvas');
    roughCanvas.width = size;
    roughCanvas.height = size;
    const roughCtx = roughCanvas.getContext('2d');

    // 1. Better Base Terrain (Value Noise)
    const noise = new SimpleNoise(Math.random());
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    // Bump data for direct manipulation
    const bumpImg = bumpCtx.createImageData(size, size);
    const bData = bumpImg.data;

    // Palette
    const cRed = { r: 180, g: 65, b: 25 };
    const cDark = { r: 80, g: 30, b: 25 };
    const cLight = { r: 210, g: 150, b: 110 };

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            // Normalized coordinates
            const nx = x / size;
            const ny = y / size;

            // FBM Noise (Fractal Brownian Motion)
            let n = 0;
            n += noise.noise2D(nx * 4, ny * 4) * 0.5;
            n += noise.noise2D(nx * 10, ny * 10) * 0.25;
            n += noise.noise2D(nx * 20, ny * 20) * 0.125;
            n += noise.noise2D(nx * 50, ny * 50) * 0.06;

            // Normalize n roughly to 0..1 from -1..1 range (approx)
            // Simplex/Value noise acts around 0.
            const val = (n + 1) * 0.5; // 0 to 1

            const idx = (y * size + x) * 4;

            // Color Blending
            let r, g, b;
            if (val < 0.35) {
                // Dark regions
                const t = val / 0.35;
                r = lerp(cDark.r, cRed.r, t);
                g = lerp(cDark.g, cRed.g, t);
                b = lerp(cDark.b, cRed.b, t);
            } else if (val < 0.7) {
                // Red midtones
                const t = (val - 0.35) / 0.35;
                r = lerp(cRed.r, cLight.r, t);
                g = lerp(cRed.g, cLight.g, t);
                b = lerp(cRed.b, cLight.b, t);
            } else {
                // Light peaks
                r = cLight.r; g = cLight.g; b = cLight.b;
            }

            // Add fine grit (high freq noise)
            const grit = (Math.random() - 0.5) * 10;
            data[idx] = Math.min(255, Math.max(0, r + grit));
            data[idx + 1] = Math.min(255, Math.max(0, g + grit));
            data[idx + 2] = Math.min(255, Math.max(0, b + grit));
            data[idx + 3] = 255;

            // Bump Map (Height)
            // Value -> Height
            const h = Math.floor(val * 200 + 30);
            bData[idx] = h;
            bData[idx + 1] = h;
            bData[idx + 2] = h;
            bData[idx + 3] = 255;
        }
    }
    ctx.putImageData(imgData, 0, 0);
    bumpCtx.putImageData(bumpImg, 0, 0);

    // Fill Roughness Base (Matte)
    roughCtx.fillStyle = '#e0e0e0';
    roughCtx.fillRect(0, 0, size, size);

    // 2. Craters (The "Realism" Pass)
    // We draw these ON TOP of the noise
    const numCraters = 350;
    for (let i = 0; i < numCraters; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = (Math.pow(Math.random(), 5) * 60) + 3; // Power 5 for more small ones

        // Color Map - Dark center, bright rim
        const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
        g.addColorStop(0, 'rgba(40, 20, 15, 0.9)');
        g.addColorStop(0.3, 'rgba(100, 40, 30, 0.7)');
        g.addColorStop(0.85, 'rgba(210, 180, 160, 0.6)'); // Ejecta
        g.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();

        // Bump Map - Deep hole, high rim
        // We use composite operations to "carve"
        const bg = bumpCtx.createRadialGradient(x, y, r * 0.2, x, y, r);
        bg.addColorStop(0, '#101010'); // Deep
        bg.addColorStop(0.5, '#505050');
        bg.addColorStop(0.85, '#ffffff'); // Rim high
        bg.addColorStop(1, 'rgba(128,128,128,0)'); // Transparent to blend

        bumpCtx.globalCompositeOperation = 'overlay'; // Blend with terrain
        bumpCtx.fillStyle = bg;
        bumpCtx.beginPath(); bumpCtx.arc(x, y, r, 0, Math.PI * 2); bumpCtx.fill();
        bumpCtx.globalCompositeOperation = 'source-over';
    }

    // 3. Ice Caps
    ctx.globalCompositeOperation = 'screen';
    const gradN = ctx.createLinearGradient(0, 0, 0, size * 0.12);
    gradN.addColorStop(0, 'rgba(255,255,255,0.95)');
    gradN.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradN; ctx.fillRect(0, 0, size, size);

    const gradS = ctx.createLinearGradient(0, size, 0, size * 0.88);
    gradS.addColorStop(0, 'rgba(255,255,255,0.95)');
    gradS.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradS; ctx.fillRect(0, 0, size, size);

    // Roughness for ice
    roughCtx.fillStyle = '#101010';
    roughCtx.globalAlpha = 0.8;
    roughCtx.fillRect(0, 0, size, size * 0.08);
    roughCtx.fillRect(0, size * 0.92, size, size * 0.08);

    return {
        texture: new THREE.CanvasTexture(canvas),
        bumpTexture: new THREE.CanvasTexture(bumpCanvas),
        roughness: new THREE.CanvasTexture(roughCanvas)
    };
}

// Simple Value Noise Class
class SimpleNoise {
    constructor(seed = Math.random()) {
        this.perm = new Uint8Array(512);
        this.grad = new Float32Array(512);
        for (let i = 0; i < 256; i++) {
            this.perm[i] = i;
            this.grad[i] = Math.cos(i / 256 * Math.PI * 2); // 1D grad for value noise
        }
        // Shuffle
        for (let i = 255; i > 0; i--) {
            const j = Math.floor((seed * 233280 + i * 9301 + 49297) % (i + 1));
            [this.perm[i], this.perm[j]] = [this.perm[j], this.perm[i]];
        }
        // Duplicate
        for (let i = 0; i < 256; i++) this.perm[i + 256] = this.perm[i];
    }

    // 2D Value Noise (Bilinear intp of lattice points)
    noise2D(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);

        const u = xf * xf * (3 - 2 * xf);
        const v = yf * yf * (3 - 2 * yf);

        const hash = (i, j) => this.perm[this.perm[i] + j];

        // Random values at corners
        const g00 = (this.perm[X + this.perm[Y]] % 256) / 255 * 2 - 1;
        const g10 = (this.perm[X + 1 + this.perm[Y]] % 256) / 255 * 2 - 1;
        const g01 = (this.perm[X + this.perm[Y + 1]] % 256) / 255 * 2 - 1;
        const g11 = (this.perm[X + 1 + this.perm[Y + 1]] % 256) / 255 * 2 - 1;

        const x1 = lerp(g00, g10, u);
        const x2 = lerp(g01, g11, u);
        return lerp(x1, x2, v);
    }
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

// Glow Texture for Atmosphere
function createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    // Soft Atmospheric Falloff
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
}

// Starfield
function createStarField() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    for (let i = 0; i < 5000; i++) {
        vertices.push((Math.random() - 0.5) * 2000);
        vertices.push((Math.random() - 0.5) * 2000);
        vertices.push((Math.random() - 0.5) * 2000);
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, transparent: true, opacity: 0.8 });
    scene.add(new THREE.Points(geometry, material));
}

// Convert Lat/Lon to Vector3
function latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));
    return new THREE.Vector3(x, y, z);
}

// Update 2D Label Positions
function updateLabels() {
    // Region labels
    regionMarkers.forEach(marker => {
        updateLabelPosition(marker.position, marker.element, 5.05); // slightly above surface
    });

    // Satellite labels/icons
    satelliteObjects.forEach(sat => {
        updateLabelPosition(sat.mesh.position, sat.labelElement, 0); // exact position
    });
}

function updateLabelPosition(position, element, minRadius) {
    if (!element) return;

    // Check if point is visible (on the front side of the sphere)
    const tempV = position.clone();
    tempV.project(camera);

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({ x: tempV.x, y: tempV.y }, camera);
    const intersects = raycaster.intersectObject(marsMesh);

    // Simple occlusion check: dot product with camera direction
    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);
    const posNorm = position.clone().normalize();
    const dot = cameraDir.dot(posNorm);

    // If dot product is negative, the surface normal is facing the camera (roughly)
    // Actually, simple distance check or angle check involves center
    const isVisible = dot < -0.2; // Show only if facing somewhat towards camera

    if (isVisible) {
        const x = (tempV.x * .5 + .5) * window.innerWidth;
        const y = (tempV.y * -.5 + .5) * window.innerHeight;

        element.style.display = 'flex';
        element.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
        element.style.zIndex = Math.floor((1 - tempV.z) * 1000); // Scale Z-index by proximity
    } else {
        element.style.display = 'none';
    }
}

// Create Region Labels (HTML)
function createRegionLabels() {
    marsRegions.forEach(region => {
        const position = latLonToVector3(region.coordinates.lat, region.coordinates.lon, 5.0);

        const el = document.createElement('div');
        el.className = 'map-label';
        el.innerHTML = `
            <div class="label-dot"></div>
            <div class="label-text">${region.name}</div>
        `;
        el.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent canvas click
            selectRegion(region);
        });

        labelsContainer.appendChild(el);

        regionMarkers.push({
            position: position,
            element: el,
            data: region
        });

        // Populate Sidebar List
        const listItem = document.createElement('div');
        listItem.className = 'nav-item';
        listItem.innerHTML = `<span>${region.name}</span> <span class="material-icons" style="font-size:14px; color:#5f6368">place</span>`;
        listItem.addEventListener('click', () => selectRegion(region));
        document.getElementById('regionsList').appendChild(listItem);
    });
}

// Create Satellites
function createSatellites() {
    marsSatellites.forEach((sat, index) => {
        if (sat.altitude === 0) return; // Skip surface rovers for orbit

        const radius = 5 + (sat.altitude / 1000);

        // 3D Mesh (tiny dot)
        // const geometry = new THREE.SphereGeometry(0.05, 8, 8);
        // const material = new THREE.MeshBasicMaterial({ color: sat.color || 0xffff00 });
        // const mesh = new THREE.Mesh(geometry, material);
        // scene.add(mesh);
        // Replaced mesh with invisible helper for position tracking, or simple dot
        const mesh = new THREE.Object3D();
        scene.add(mesh);

        // Orbit Line
        const orbitCurve = new THREE.EllipseCurve(
            0, 0,
            radius, radius, // Simplified circular orbit for visual clarity
            0, 2 * Math.PI,
            false, 0
        );
        const points = orbitCurve.getPoints(64);
        const orbitGeo = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(p.x, 0, p.y)));
        orbitGeo.rotateX(Math.PI / 2); // Flat on XZ plane initially
        orbitGeo.rotateZ(sat.inclination * Math.PI / 180); // Tilt
        // orbitGeo.rotateY(Math.random() * Math.PI); // Random longitude of ascending node

        const orbitMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
        const orbitLine = new THREE.Line(orbitGeo, orbitMat);
        scene.add(orbitLine);

        // Label Element
        const el = document.createElement('div');
        el.className = 'map-label satellite';
        el.innerHTML = `
            <div class="label-dot" style="border-color:${sat.color || 'gold'}"></div>
            <div class="label-text">${sat.name}</div>
        `;
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            selectSatellite(sat);
        });
        labelsContainer.appendChild(el);

        satelliteObjects.push({
            mesh: mesh,
            labelElement: el,
            data: sat,
            radius: radius,
            angle: (index / marsSatellites.length) * Math.PI * 2,
            speed: (sat.speed || 1) * 0.005,
            inclination: sat.inclination
        });

        // Sidebar List
        const listItem = document.createElement('div');
        listItem.className = 'nav-item';
        listItem.innerHTML = `<span>${sat.name}</span> <span class="material-icons" style="font-size:14px; color:#5f6368">satellite</span>`;
        listItem.addEventListener('click', () => selectSatellite(sat));
        document.getElementById('satellitesList').appendChild(listItem);
    });
}

// Selection Logic
function selectRegion(region) {
    selectedTarget = region.coordinates;
    const pos = latLonToVector3(region.coordinates.lat, region.coordinates.lon, 8);
    animateCameraTo(pos);
    showInfoCard(region, 'place');
}

function selectSatellite(sat) {
    // For satellites, we just track them? Or pause and look?
    // Let's just show info for now
    showInfoCard(sat, 'satellite');
}

function showInfoCard(data, type) {
    infoCard.style.display = 'flex';
    document.getElementById('cardTitle').textContent = data.name;
    document.getElementById('cardDesc').textContent = data.description;

    const statsContainer = document.getElementById('cardStats');
    statsContainer.innerHTML = '';

    // Dynamic stats based on data
    Object.entries(data).forEach(([key, value]) => {
        if (['id', 'name', 'description', 'color', 'coordinates', 'raan', 'eccentricity'].includes(key)) return;

        const row = document.createElement('div');
        row.className = 'stat-row';
        row.innerHTML = `
            <span class="stat-label">${key.toUpperCase()}</span>
            <span class="stat-val">${value}</span>
        `;
        statsContainer.appendChild(row);
    });

    // Update target name in bottom bar
    document.getElementById('targetName').textContent = data.name;
}

// Camera Animation
function animateCameraTo(targetPos) {
    const startPos = camera.position.clone();
    const duration = 1500;
    const startTime = Date.now();

    function update() {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease out

        camera.position.lerpVectors(startPos, targetPos, ease);
        controls.update();

        if (progress < 1) requestAnimationFrame(update);
    }
    update();
}

// Controls Logic
function setupControls() {
    controls = {
        target: new THREE.Vector3(0, 0, 0),
        update: function () {
            camera.lookAt(this.target);
        }
    }

    // Orbit logic (Simplified custom implementation or use THREE.OrbitControls if available)
    // Here we stick to a simple mouse drag logic for rotation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const container = document.getElementById('canvas-container');

    container.addEventListener('mousedown', (e) => { isDragging = true; });
    container.addEventListener('mouseup', () => { isDragging = false; });
    container.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaMove = {
                x: e.offsetX - previousMousePosition.x,
                y: e.offsetY - previousMousePosition.y
            };

            // Rotate camera around scene (Earth style)
            // Ideally we rotate the camera position based on spherical coordinates
            const spherical = new THREE.Spherical().setFromVector3(camera.position);
            spherical.theta -= deltaMove.x * 0.005;
            spherical.phi -= deltaMove.y * 0.005;
            spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

            camera.position.setFromSpherical(spherical);
            camera.lookAt(scene.position);

            autoRotation = false; // Stop auto rotate on interaction
        }
        previousMousePosition = { x: e.offsetX, y: e.offsetY };
    });

    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomSpeed = 0.05;
        const spherical = new THREE.Spherical().setFromVector3(camera.position);
        spherical.radius += e.deltaY * 0.01;
        spherical.radius = Math.max(5.5, Math.min(50, spherical.radius));
        camera.position.setFromSpherical(spherical);
    });
}

// UI Event Listeners
function setupUI() {
    // Menu / Sidebar
    document.getElementById('menuBtn').addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Close Card
    document.getElementById('closeCard').addEventListener('click', () => {
        infoCard.style.display = 'none';
        selectedTarget = null;
        document.getElementById('targetName').textContent = 'Mars';
    });

    // Search
    const searchInput = document.getElementById('mainSearch');
    const performSearch = () => {
        const query = searchInput.value.toLowerCase();
        const region = marsRegions.find(r => r.name.toLowerCase().includes(query));
        if (region) selectRegion(region);

        const sat = marsSatellites.find(s => s.name.toLowerCase().includes(query));
        if (sat) selectSatellite(sat);
    };
    document.getElementById('searchAction').addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });

    // Zoom Buttons
    document.getElementById('zoomIn').addEventListener('click', () => {
        const vec = camera.position.clone().normalize();
        camera.position.addScaledVector(vec, -2);
    });
    document.getElementById('zoomOut').addEventListener('click', () => {
        const vec = camera.position.clone().normalize();
        camera.position.addScaledVector(vec, 2);
    });

    // Toggle Rotation
    document.getElementById('toggleRotation').addEventListener('click', () => {
        autoRotation = !autoRotation;
    });

    // Compass (Reset View)
    document.getElementById('compass').addEventListener('click', () => {
        animateCameraTo(new THREE.Vector3(0, 0, 18));
    });

    // Speed Control
    document.getElementById('timeSpeed').addEventListener('input', (e) => {
        simulationSpeed = parseFloat(e.target.value);
    });
}

// Speed Control
let simulationSpeed = 1.0;

// Animation Loop
let lastTime = Date.now();

function animate() {
    requestAnimationFrame(animate);

    const now = Date.now();
    const delta = (now - lastTime) * 0.001;
    lastTime = now;

    // Auto Rotate Mars
    if (autoRotation && marsMesh) {
        marsMesh.rotation.y += 0.05 * delta * simulationSpeed;
    }

    // Rotate Clouds
    if (atmosphereMesh) {
        atmosphereMesh.rotation.y += 0.07 * delta * simulationSpeed;
    }

    // Update Satellites Positions
    satelliteObjects.forEach(sat => {
        // Increment angle based on speed and delta
        // original speed was around 0.005 per ms? no, (sat.speed || 1) * 0.005
        // let's adjust scale to be reasonable
        sat.currentAngle = (sat.currentAngle || sat.angle);
        sat.currentAngle += sat.speed * 100 * delta * simulationSpeed;

        const angle = sat.currentAngle;

        // Parametric equation for orbit in 3D
        const r = sat.radius;

        // Position on flat ring:
        const x = r * Math.cos(angle);
        const z = r * Math.sin(angle);

        // Apply inclination (rotate around X axis)
        const incRad = sat.inclination * Math.PI / 180;
        const y_tilt = z * Math.sin(incRad);
        const z_tilt = z * Math.cos(incRad);

        sat.mesh.position.set(x, y_tilt, z_tilt);

        // Update label position
        if (sat.labelElement) {
            updateLabelPosition(sat.mesh.position, sat.labelElement, 0);
        }
    });

    // Update DOM Labels (Regions)
    updateLabels();

    // Altitude Indicator
    const alt = camera.position.length() - 5;
    document.getElementById('cameraAlt').textContent = (alt * 1000).toFixed(0);

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Start
window.addEventListener('load', init);

// Cloud Texture Generation
function createCloudTexture() {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Fill transparent
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, size, size);

    // Simple cloud noise
    for (let i = 0; i < 300; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = Math.random() * 80 + 20;

        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(255,255,255,0.4)');
        g.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    return new THREE.CanvasTexture(canvas);
}
