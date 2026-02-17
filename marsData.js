// Mars Regions Data
const marsRegions = [
    {
        id: 'olympus-mons',
        name: 'Olympus Mons',
        type: 'Volcano',
        coordinates: { lat: 18.65, lon: -133.8 },
        mass: '2.5 × 10^15 kg',
        diameter: '624 km',
        height: '21.9 km',
        atmosphere: 'Thin CO₂ atmosphere at summit',
        description: 'Largest volcano in the solar system',
        color: '#8B4513'
    },
    {
        id: 'valles-marineris',
        name: 'Valles Marineris',
        type: 'Canyon System',
        coordinates: { lat: -13.9, lon: -59.2 },
        mass: '1.8 × 10^14 kg',
        diameter: '4000 km',
        depth: '7 km',
        atmosphere: 'Surface pressure ~0.6 kPa',
        description: 'Largest canyon system in the solar system',
        color: '#654321'
    },
    {
        id: 'hellas-planitia',
        name: 'Hellas Planitia',
        type: 'Impact Basin',
        coordinates: { lat: -42.4, lon: 70.5 },
        mass: '3.2 × 10^15 kg',
        diameter: '2300 km',
        depth: '7.2 km',
        atmosphere: 'Denser atmosphere due to depth',
        description: 'One of the largest impact craters on Mars',
        color: '#A0522D'
    },
    {
        id: 'tharsis-rise',
        name: 'Tharsis Rise',
        type: 'Volcanic Plateau',
        coordinates: { lat: 0, lon: -112 },
        mass: '5.0 × 10^15 kg',
        diameter: '5000 km',
        height: '10 km',
        atmosphere: 'Thin atmosphere, high altitude',
        description: 'Massive volcanic plateau with several large volcanoes',
        color: '#CD853F'
    },
    {
        id: 'north-polar-cap',
        name: 'North Polar Cap',
        type: 'Ice Cap',
        coordinates: { lat: 85, lon: 0 },
        mass: '1.6 × 10^16 kg',
        diameter: '1000 km',
        thickness: '3 km',
        atmosphere: 'Seasonal CO₂ and water ice',
        description: 'Permanent water ice cap with seasonal CO₂',
        color: '#E0E0E0'
    },
    {
        id: 'south-polar-cap',
        name: 'South Polar Cap',
        type: 'Ice Cap',
        coordinates: { lat: -87, lon: 0 },
        mass: '1.2 × 10^16 kg',
        diameter: '350 km',
        thickness: '3.7 km',
        atmosphere: 'Permanent CO₂ ice cap',
        description: 'Permanent carbon dioxide ice cap',
        color: '#F0F0F0'
    },
    {
        id: 'gale-crater',
        name: 'Gale Crater',
        type: 'Impact Crater',
        coordinates: { lat: -5.4, lon: 137.8 },
        mass: '8.5 × 10^13 kg',
        diameter: '154 km',
        depth: '4.5 km',
        atmosphere: 'Surface pressure ~0.7 kPa',
        description: 'Landing site of Curiosity rover, contains Mount Sharp',
        color: '#9C7B3C'
    },
    {
        id: 'jezero-crater',
        name: 'Jezero Crater',
        type: 'Impact Crater',
        coordinates: { lat: 18.38, lon: 77.58 },
        mass: '7.2 × 10^13 kg',
        diameter: '49 km',
        depth: '500 m',
        atmosphere: 'Surface pressure ~0.7 kPa',
        description: 'Landing site of Perseverance rover, ancient river delta',
        color: '#8B7355'
    }
];

// Mars Satellites Data
const marsSatellites = [
    {
        id: 'phobos',
        name: 'Phobos',
        noradId: 'MARS-PHOBOS',
        orbitClass: 'Martian Moon',
        altitude: 9377, // km from Mars center
        speed: 2.14, // km/s
        inclination: 1.08, // degrees
        period: 0.319, // days
        mass: '1.0659 × 10^16 kg',
        diameter: '22.2 km',
        description: 'Larger and closer of Mars\'s two moons',
        color: '#FFD700',
        raan: 0,
        eccentricity: 0.0151
    },
    {
        id: 'deimos',
        name: 'Deimos',
        noradId: 'MARS-DEIMOS',
        orbitClass: 'Martian Moon',
        altitude: 23460, // km from Mars center
        speed: 1.35, // km/s
        inclination: 0.93, // degrees
        period: 1.263, // days
        mass: '1.4762 × 10^15 kg',
        diameter: '12.6 km',
        description: 'Smaller and more distant of Mars\'s two moons',
        color: '#FFA500',
        raan: 0,
        eccentricity: 0.0002
    },
    {
        id: 'mars-express',
        name: 'Mars Express',
        noradId: '27827',
        orbitClass: 'Polar Orbit',
        altitude: 298, // km average
        speed: 3.4, // km/s
        inclination: 86.3,
        period: 0.075, // days
        mass: '1123 kg',
        diameter: '1.5 m × 1.8 m × 1.4 m',
        description: 'ESA orbiter studying Mars atmosphere and surface',
        color: '#00BFFF',
        raan: 0,
        eccentricity: 0.571
    },
    {
        id: 'mars-reconnaissance',
        name: 'Mars Reconnaissance Orbiter',
        noradId: '28788',
        orbitClass: 'Sun-Synchronous',
        altitude: 255, // km average
        speed: 3.4, // km/s
        inclination: 93.0,
        period: 0.072, // days
        mass: '2180 kg',
        diameter: '6.5 m × 13.6 m',
        description: 'NASA orbiter providing high-resolution imaging',
        color: '#4169E1',
        raan: 0,
        eccentricity: 0.011
    },
    {
        id: 'mars-odyssey',
        name: 'Mars Odyssey',
        noradId: '26734',
        orbitClass: 'Sun-Synchronous',
        altitude: 400, // km average
        speed: 3.2, // km/s
        inclination: 93.1,
        period: 0.088, // days
        mass: '725 kg',
        diameter: '2.2 m × 1.7 m × 2.6 m',
        description: 'NASA orbiter mapping surface composition',
        color: '#1E90FF',
        raan: 0,
        eccentricity: 0.011
    },
    {
        id: 'maven',
        name: 'MAVEN',
        noradId: '39378',
        orbitClass: 'Elliptical',
        altitude: 150, // km periapsis
        speed: 3.5, // km/s average
        inclination: 75.0,
        period: 0.083, // days
        mass: '2550 kg',
        diameter: '2.3 m × 2.3 m × 2.0 m',
        description: 'NASA mission studying Mars upper atmosphere',
        color: '#9370DB',
        raan: 0,
        eccentricity: 0.571
    },
    {
        id: 'trace-gas-orbiter',
        name: 'Trace Gas Orbiter',
        noradId: '41382',
        orbitClass: 'Circular',
        altitude: 400, // km
        speed: 3.2, // km/s
        inclination: 74.0,
        period: 0.088, // days
        mass: '3732 kg',
        diameter: '3.2 m × 2.0 m × 2.0 m',
        description: 'ESA-Roscosmos orbiter detecting atmospheric trace gases',
        color: '#32CD32',
        raan: 0,
        eccentricity: 0.0
    },
    {
        id: 'mars-2020',
        name: 'Mars 2020 (Perseverance)',
        noradId: '47827',
        orbitClass: 'Surface',
        altitude: 0,
        speed: 0,
        inclination: 0,
        period: 0,
        mass: '1025 kg',
        diameter: '3 m × 2.7 m × 2.2 m',
        description: 'NASA rover exploring Jezero Crater',
        color: '#FF6347',
        raan: 0,
        eccentricity: 0
    }
];

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { marsRegions, marsSatellites };
}
