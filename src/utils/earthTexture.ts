import * as THREE from 'three';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import countries110m from 'world-atlas/countries-110m.json';
import { DESTINATIONS_DATA } from '../data/destinations';

export interface EarthTextures {
  dayMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  cloudMap: THREE.CanvasTexture;
  dispose: () => void;
}

interface GeoRing {
  coordinates: number[][][];
}

function drawPolygonRings(
  ctx: CanvasRenderingContext2D,
  rings: number[][][],
  width: number,
  height: number
) {
  ctx.beginPath();
  for (const ring of rings) {
    if (ring.length === 0) continue;
    let prevLng = ring[0][0];
    let started = false;

    for (let i = 0; i < ring.length; i++) {
      const [lng, lat] = ring[i];
      // Prevent antimeridian horizontal wrap-around streaks
      if (i > 0 && Math.abs(lng - prevLng) > 180) {
        const x = ((lng + 180) / 360) * width;
        const y = ((90 - lat) / 180) * height;
        ctx.moveTo(x, y);
      } else {
        const x = ((lng + 180) / 360) * width;
        const y = ((90 - lat) / 180) * height;
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      prevLng = lng;
    }
    ctx.closePath();
  }
}

export function extractWorldCountryPolygons(): number[][][][] {
  const topology = countries110m as unknown as Topology<{
    countries: GeometryCollection;
  }>;
  const geo = feature(topology, topology.objects.countries);
  const allPolygons: number[][][][] = [];

  for (const feat of geo.features) {
    if (!feat.geometry) continue;
    if (feat.geometry.type === 'Polygon') {
      allPolygons.push(feat.geometry.coordinates as number[][][]);
    } else if (feat.geometry.type === 'MultiPolygon') {
      for (const poly of feat.geometry.coordinates as number[][][][]) {
        allPolygons.push(poly);
      }
    }
  }
  return allPolygons;
}

/**
 * Generates high-resolution geographically accurate Earth day, bump, and cloud textures
 * from Natural Earth 110m vector data (zero external image requests).
 */
export function createEarthTextures(maxAnisotropy = 4): EarthTextures {
  const W = 2048;
  const H = 1024;
  const polygons = extractWorldCountryPolygons();

  // 1. Day Albedo Map
  const dayCanvas = document.createElement('canvas');
  dayCanvas.width = W;
  dayCanvas.height = H;
  const ctx = dayCanvas.getContext('2d')!;

  // Rich ocean bathymetry gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, H);
  oceanGrad.addColorStop(0, '#224461');
  oceanGrad.addColorStop(0.14, '#1B3A57');
  oceanGrad.addColorStop(0.5, '#15314B');
  oceanGrad.addColorStop(0.86, '#1B3A57');
  oceanGrad.addColorStop(1, '#244664');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle lat/lng graticule lines for vintage cartography feel
  ctx.strokeStyle = 'rgba(244, 235, 221, 0.06)';
  ctx.lineWidth = 1;
  for (let lng = -150; lng <= 150; lng += 30) {
    const x = ((lng + 180) / 360) * W;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = ((90 - lat) / 180) * H;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Soft continental shelf halo
  ctx.save();
  ctx.fillStyle = 'rgba(72, 134, 158, 0.28)';
  ctx.strokeStyle = 'rgba(72, 134, 158, 0.35)';
  ctx.lineWidth = 6;
  for (const rings of polygons) {
    drawPolygonRings(ctx, rings, W, H);
    ctx.stroke();
  }
  ctx.restore();

  // Landmass latitude biome fill
  const landGrad = ctx.createLinearGradient(0, 0, 0, H);
  landGrad.addColorStop(0, '#DCE4E8'); // Arctic snow/ice
  landGrad.addColorStop(0.13, '#6F8267'); // Boreal forest
  landGrad.addColorStop(0.28, '#5B7B54'); // Temperate
  landGrad.addColorStop(0.38, '#B8A074'); // Subtropical belt
  landGrad.addColorStop(0.5, '#4F7249'); // Equatorial lush green
  landGrad.addColorStop(0.62, '#9A8C66'); // Southern dry belt
  landGrad.addColorStop(0.76, '#627B5A'); // Southern temperate
  landGrad.addColorStop(0.88, '#E4EBF0'); // Antarctic ice
  landGrad.addColorStop(1, '#EEF3F7');

  ctx.fillStyle = landGrad;
  ctx.strokeStyle = 'rgba(244, 235, 221, 0.25)';
  ctx.lineWidth = 1.1;

  for (const rings of polygons) {
    drawPolygonRings(ctx, rings, W, H);
    ctx.fill();
    ctx.stroke();
  }

  // Subtle warm golden glow dots at the 20 featured destinations
  for (const d of DESTINATIONS_DATA) {
    const x = ((d.lng + 180) / 360) * W;
    const y = ((90 - d.lat) / 180) * H;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 10);
    glow.addColorStop(0, 'rgba(255, 226, 155, 0.85)');
    glow.addColorStop(1, 'rgba(255, 226, 155, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  const dayMap = new THREE.CanvasTexture(dayCanvas);
  dayMap.colorSpace = THREE.SRGBColorSpace;
  dayMap.anisotropy = maxAnisotropy;
  dayMap.wrapS = THREE.RepeatWrapping;
  dayMap.wrapT = THREE.ClampToEdgeWrapping;
  dayMap.needsUpdate = true;

  // 2. Grayscale Bump Map (ocean=flat dark, land=elevated bright)
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 1024;
  bumpCanvas.height = 512;
  const bctx = bumpCanvas.getContext('2d')!;
  bctx.fillStyle = '#181818';
  bctx.fillRect(0, 0, 1024, 512);
  bctx.fillStyle = '#B8B8B8';
  bctx.strokeStyle = '#606060';
  bctx.lineWidth = 1.5;
  for (const rings of polygons) {
    drawPolygonRings(bctx, rings, 1024, 512);
    bctx.fill();
    bctx.stroke();
  }

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.colorSpace = THREE.NoColorSpace;
  bumpMap.anisotropy = maxAnisotropy;
  bumpMap.needsUpdate = true;

  // 3. Soft Atmospheric Cloud Layer
  const cloudCanvas = document.createElement('canvas');
  cloudCanvas.width = 1024;
  cloudCanvas.height = 512;
  const cctx = cloudCanvas.getContext('2d')!;
  cctx.clearRect(0, 0, 1024, 512);

  // Deterministic wispy cloud puffs
  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  for (let i = 0; i < 160; i++) {
    const cx = rand() * 1024;
    const cy = 40 + rand() * 432;
    const rx = 24 + rand() * 58;
    const ry = 8 + rand() * 18;
    const grad = cctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
    grad.addColorStop(0, 'rgba(255, 252, 246, 0.24)');
    grad.addColorStop(1, 'rgba(255, 252, 246, 0)');
    cctx.fillStyle = grad;
    cctx.beginPath();
    cctx.ellipse(cx, cy, rx, ry, (rand() - 0.5) * 0.4, 0, Math.PI * 2);
    cctx.fill();
  }

  const cloudMap = new THREE.CanvasTexture(cloudCanvas);
  cloudMap.colorSpace = THREE.SRGBColorSpace;
  cloudMap.wrapS = THREE.RepeatWrapping;
  cloudMap.needsUpdate = true;

  return {
    dayMap,
    bumpMap,
    cloudMap,
    dispose: () => {
      dayMap.dispose();
      bumpMap.dispose();
      cloudMap.dispose();
    },
  };
}
