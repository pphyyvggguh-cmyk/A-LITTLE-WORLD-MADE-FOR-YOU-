export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/**
 * Converts geographic latitude/longitude (in degrees) into 3D Cartesian coordinates
 * matching Three.js SphereGeometry's equirectangular UV projection:
 *   phi = (lng + 180) * DEG2RAD
 *   theta = (90 - lat) * DEG2RAD
 *   x = -r * cos(phi) * sin(theta)
 *   y =  r * cos(theta)
 *   z =  r * sin(phi) * sin(theta)
 */
export function latLngToVector3(lat: number, lng: number, radius = 1): Vec3 {
  const phi = (lng + 180) * DEG2RAD;
  const theta = (90 - lat) * DEG2RAD;
  const sinTheta = Math.sin(theta);

  return {
    x: -radius * Math.cos(phi) * sinTheta,
    y: radius * Math.cos(theta),
    z: radius * Math.sin(phi) * sinTheta,
  };
}

/**
 * Inverse conversion from 3D Cartesian vector back to geographic lat/lng (degrees).
 */
export function vector3ToLatLng(v: Vec3): { lat: number; lng: number } {
  const r = Math.hypot(v.x, v.y, v.z);
  if (r === 0) return { lat: 0, lng: 0 };
  const clampedY = Math.max(-1, Math.min(1, v.y / r));
  const theta = Math.acos(clampedY);
  const lat = 90 - theta * RAD2DEG;
  let phi = Math.atan2(v.z, -v.x);
  if (phi < 0) phi += Math.PI * 2;
  const lng = phi * RAD2DEG - 180;
  return { lat, lng };
}

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v.x, v.y, v.z);
  if (len < 1e-8) return { x: 0, y: 1, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

/**
 * Great-circle angular distance in radians between two lat/lng coordinates.
 */
export function greatCircleAngle(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const u0 = latLngToVector3(lat1, lng1, 1);
  const u1 = latLngToVector3(lat2, lng2, 1);
  return Math.acos(Math.max(-1, Math.min(1, dot(u0, u1))));
}

/**
 * Great-circle distance in kilometers (Earth mean radius = 6371 km).
 */
export function greatCircleDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  return Math.round(greatCircleAngle(lat1, lng1, lat2, lng2) * 6371);
}

/**
 * Spherical linear interpolation (SLERP) along the great circle between two points
 * with a smooth sinusoidal altitude arc above the globe surface.
 */
export function sampleGreatCircleArc(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  radius: number,
  t: number,
  maxArcHeight = 0.22
): { position: Vec3; tangent: Vec3; normal: Vec3 } {
  const clampedT = Math.max(0, Math.min(1, t));
  const u0 = latLngToVector3(fromLat, fromLng, 1);
  const u1 = latLngToVector3(toLat, toLng, 1);

  const cosOmega = Math.max(-1, Math.min(1, dot(u0, u1)));
  const omega = Math.acos(cosOmega);

  const evalDir = (s: number): Vec3 => {
    if (omega < 1e-4) {
      return normalize({
        x: u0.x + (u1.x - u0.x) * s,
        y: u0.y + (u1.y - u0.y) * s,
        z: u0.z + (u1.z - u0.z) * s,
      });
    }
    if (Math.PI - omega < 1e-3) {
      // Antipodal fallback: pick deterministic orthogonal axis
      const ref = Math.abs(u0.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
      const ortho = normalize(cross(u0, ref));
      const angle = s * Math.PI;
      return normalize({
        x: u0.x * Math.cos(angle) + ortho.x * Math.sin(angle),
        y: u0.y * Math.cos(angle) + ortho.y * Math.sin(angle),
        z: u0.z * Math.cos(angle) + ortho.z * Math.sin(angle),
      });
    }
    const sinOmega = Math.sin(omega);
    const w0 = Math.sin((1 - s) * omega) / sinOmega;
    const w1 = Math.sin(s * omega) / sinOmega;
    return normalize({
      x: u0.x * w0 + u1.x * w1,
      y: u0.y * w0 + u1.y * w1,
      z: u0.z * w0 + u1.z * w1,
    });
  };

  // Scale max arc height proportionally to route length so short hops stay tidy and long flights soar gracefully
  const effectiveArcHeight = maxArcHeight * Math.min(1, Math.max(0.28, omega / (Math.PI * 0.65)));

  const evalPos = (s: number): Vec3 => {
    const dir = evalDir(s);
    const alt = Math.sin(Math.PI * s) * effectiveArcHeight;
    const r = radius + alt;
    return { x: dir.x * r, y: dir.y * r, z: dir.z * r };
  };

  const position = evalPos(clampedT);
  const normal = evalDir(clampedT);

  const eps = 0.005;
  const pPrev = evalPos(Math.max(0, clampedT - eps));
  const pNext = evalPos(Math.min(1, clampedT + eps));
  const tangent = normalize({
    x: pNext.x - pPrev.x,
    y: pNext.y - pPrev.y,
    z: pNext.z - pPrev.z,
  });

  return { position, tangent, normal };
}

/**
 * Generates an array of points along the great-circle arc for rendering the flight trail.
 */
export function buildGreatCircleArcPoints(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  radius: number,
  segments = 64,
  maxArcHeight = 0.22
): Vec3[] {
  const pts: Vec3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    pts.push(sampleGreatCircleArc(fromLat, fromLng, toLat, toLng, radius, t, maxArcHeight).position);
  }
  return pts;
}
