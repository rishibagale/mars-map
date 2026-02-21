// =====================================================================
// Mars 3D Interactive Map — Phase 2: Advanced Cinematic Realism
// =====================================================================

console.log("Initializing Mars Cinematic Engine...");

// ── Scene Setup ─────────────────────────────────────────────────────
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 2000);
camera.position.set(0, 1, 7);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

// ── Advanced Procedural Mars Material ───────────────────────────────
// We'll use a more complex shader-like material by combining noise maps.

function generateProceduralMaps() {
    const w = 2048, h = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');

    // 1. Base color (Martian Ochre)
    ctx.fillStyle = '#c1440e';
    ctx.fillRect(0, 0, w, h);

    const rand = (s) => (Math.sin(s * 12.9898 + 78.233) * 43758.5453) % 1;

    // 2. Large scale basaltic regions (Dark patches)
    for (let i = 0; i < 400; i++) {
        const x = Math.random() * w, y = Math.random() * h;
        const r = 50 + Math.random() * 200;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(60, 20, 5, 0.6)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    // 3. Fine grain "fractal" detail (Sand ripples / Rocks)
    ctx.globalAlpha = 0.2;
    for (let i = 0; i < 10000; i++) {
        const x = Math.random() * w, y = Math.random() * h;
        ctx.fillStyle = (Math.random() > 0.5) ? '#ffffff' : '#000000';
        ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1.0;

    // 4. Polar Caps (Soft white ice)
    const polarG = ctx.createLinearGradient(0, 0, 0, h);
    polarG.addColorStop(0.0, 'rgba(255,255,255,0.8)');
    polarG.addColorStop(0.08, 'rgba(255,255,255,0)');
    polarG.addColorStop(0.92, 'rgba(255,255,255,0)');
    polarG.addColorStop(1.0, 'rgba(255,255,255,0.8)');
    ctx.fillStyle = polarG;
    ctx.fillRect(0, 0, w, h);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return texture;
}

const marsColorTexture = generateProceduralMaps();

// ── Shaders: Rim Lighting & Atmosphere ─────────────────────────────

// 1. Surface Shader (Adds the "Twilight Glow" on the planet's edge)
const surfaceMaterial = new THREE.MeshStandardMaterial({
    map: marsColorTexture,
    roughness: 0.9,
    metalness: 0.05,
    bumpScale: 0.15
});

// Customizing the material to inject a Rim Light / Fresnel effect
surfaceMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.rimColor = { value: new THREE.Color(0xff6622) };
    shader.uniforms.rimPower = { value: 3.5 };

    shader.vertexShader = `
        varying vec3 vViewPosition;
        varying vec3 vWorldNormal;
        ${shader.vertexShader}
    `.replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
         vWorldNormal = normalize(modelMatrix * vec4(normal, 0.0)).xyz;
         vViewPosition = -vHighPrecisionShaderPosition.xyz;`
    );

    shader.fragmentShader = `
        uniform vec3 rimColor;
        uniform float rimPower;
        varying vec3 vViewPosition;
        varying vec3 vWorldNormal;
        ${shader.fragmentShader}
    `.replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
         vec3 viewDir = normalize(vViewPosition);
         float rim = 1.0 - max(dot(viewDir, vWorldNormal), 0.0);
         rim = pow(rim, rimPower);
         gl_FragColor.rgb += rimColor * rim * 0.4;`
    );
};

const marsGlobe = new THREE.Mesh(new THREE.SphereGeometry(2, 128, 128), surfaceMaterial);
scene.add(marsGlobe);

// 2. Advanced Scattering Atmosphere (The "Haze")
const atmosphereMaterial = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: {
        sunPos: { value: new THREE.Vector3(5, 2, 5).normalize() }
    },
    vertexShader: `
        varying vec3 vNormal;
        varying vec3 vEye;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            vEye = normalize(modelViewMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vEye;
        uniform vec3 sunPos;
        void main() {
            // Fresnel / Rim thickness
            float dotProduct = dot(vNormal, vec3(0.0, 0.0, 1.0));
            float intensity = pow(0.7 - max(dotProduct, 0.0), 3.0);
            
            // Light scattering (Brighter where sun hits)
            float sunScatter = max(dot(vNormal, sunPos), 0.0);
            vec3 scatterCol = mix(vec3(0.8, 0.2, 0.1), vec3(1.0, 0.5, 0.2), sunScatter);
            
            gl_FragColor = vec4(scatterCol, 1.0) * intensity * (0.8 + sunScatter * 1.5);
        }
    `
});

const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(2.15, 64, 64), atmosphereMaterial);
scene.add(atmosphere);

// ── Realistic Space Environment ────────────────────────────────────

// Starfield with variance
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(8000 * 3);
for (let i = 0; i < starPos.length; i++) starPos[i] = (Math.random() - 0.5) * 1200;
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xaaaaaa, size: 0.4 }));
scene.add(stars);

// ── Lighting (High Contrast NASA look) ─────────────────────────────
const sun = new THREE.DirectionalLight(0xffffff, 4);
sun.position.set(5, 2, 5);
scene.add(sun);

// Subtle Fill Light (representing reflected light from stars/dust)
const fill = new THREE.PointLight(0xff4411, 0.5);
fill.position.set(-5, -2, -5);
scene.add(fill);

// Dark side Ambient (barely visible)
scene.add(new THREE.AmbientLight(0x110804, 0.4));

// ── Landmarks & Interaction ─────────────────────────────────────────
const LANDMARKS = [
    { name: "Olympus Mons", lat: 18.65, lon: -133.8 },
    { name: "Valles Marineris", lat: -13.9, lon: -59.2 },
    { name: "Curiosity (Gale)", lat: -4.58, lon: 137.44 },
    { name: "Perseverance (Jezero)", lat: 18.38, lon: 77.58 }
];

function latLonTo3D(lat, lon, r) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
    );
}

LANDMARKS.forEach(pt => {
    const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xffcc44 })
    );
    marker.position.copy(latLonTo3D(pt.lat, pt.lon, 2.01));
    scene.add(marker);
});

// ── Controls & UI ──────────────────────────────────────────────────
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 2.4;
controls.maxDistance = 20;

const coordsEl = document.getElementById('coords');
const altitudeEl = document.getElementById('altitude');

function updateUI() {
    const p = camera.position.clone().normalize();
    const lat = (Math.asin(p.y) * 180 / Math.PI).toFixed(2);
    const lon = (Math.atan2(p.z, -p.x) * 180 / Math.PI).toFixed(2);
    const alt = Math.round(((camera.position.length() - 2) / 2) * 3389);
    coordsEl.innerText = `Lat: ${lat}° Lon: ${lon}°`;
    altitudeEl.innerText = `Alt: ${alt.toLocaleString()} km`;
}

// ── Main Loop ──────────────────────────────────────────────────────
function animate() {
    requestAnimationFrame(animate);

    // Rotation
    marsGlobe.rotation.y += 0.0001;
    atmosphere.rotation.y += 0.0001;

    controls.update();
    updateUI();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});

animate();
console.log("Mars Phase 2 Realism Active ✅");
