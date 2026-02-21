import sys
import subprocess
import os

"""
STEP 3: Terrain & Elevation (Python / GDAL)
-------------------------------------------
This script demonstrates how to process NASA MOLA (Mars Orbiter Laser Altimeter) 
data into a grayscale displacement map that Three.js can use.

Requirements:
- GDAL (pip install gdal or install via OS package manager)
- NASA MOLA Data: Download .img or .tif files from:
  https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/

Example usage:
python process_terrain.py input_mola.tif output_heightmap.png
"""

def process_dem(input_path, output_path):
    print(f"Processing {input_path}...")
    
    # 1. Resize to a power-of-two for Three.js performance
    # 2. Scale values to 0-255 (8-bit grayscale) for simple displacement mapping
    try:
        cmd = [
            'gdal_translate',
            '-of', 'PNG',
            '-outsize', '2048', '1024',
            '-scale', # Automatically scales min/max elevation to 0-255
            input_path,
            output_path
        ]
        subprocess.run(cmd, check=True)
        print(f"Success! Saved terrain heightmap to {output_path}")
    except Exception as e:
        print(f"Error: Make sure GDAL is installed. {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python process_terrain.py <input_dem.tif> <output.png>")
    else:
        process_dem(sys.argv[1], sys.argv[2])
