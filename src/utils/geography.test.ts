import test from 'node:test';
import assert from 'node:assert/strict';
import {
  latLngToVector3,
  vector3ToLatLng,
  greatCircleDistanceKm,
  sampleGreatCircleArc,
  buildGreatCircleArcPoints,
} from './geography';

test('latLngToVector3 maps poles and equator accurately for SphereGeometry UV', () => {
  const northPole = latLngToVector3(90, 0, 2);
  assert.ok(Math.abs(northPole.y - 2) < 1e-6);
  assert.ok(Math.hypot(northPole.x, northPole.z) < 1e-6);

  const southPole = latLngToVector3(-90, 0, 2);
  assert.ok(Math.abs(southPole.y + 2) < 1e-6);

  // Prime Meridian on equator (u=0.5, phi=PI) -> +X
  const prime = latLngToVector3(0, 0, 1);
  assert.ok(Math.abs(prime.x - 1) < 1e-6);
  assert.ok(Math.abs(prime.y) < 1e-6);
  assert.ok(Math.abs(prime.z) < 1e-6);

  // 90°E -> -Z
  const east90 = latLngToVector3(0, 90, 1);
  assert.ok(Math.abs(east90.z + 1) < 1e-6);
});

test('vector3ToLatLng round-trips major destinations within 1e-4 deg', () => {
  const coords = [
    { lat: -6.9175, lng: 107.6191 }, // Bandung
    { lat: 35.6762, lng: 139.6503 }, // Tokyo
    { lat: 38.9072, lng: -77.0369 }, // Washington, D.C.
    { lat: -35.2809, lng: 149.13 }, // Canberra
    { lat: 8.9824, lng: -79.5199 }, // Panama City
  ];

  for (const c of coords) {
    const v = latLngToVector3(c.lat, c.lng, 3);
    const back = vector3ToLatLng(v);
    assert.ok(Math.abs(back.lat - c.lat) < 1e-4, `lat mismatch for ${c.lat}`);
    assert.ok(Math.abs(back.lng - c.lng) < 1e-4, `lng mismatch for ${c.lng}`);
  }
});

test('greatCircleDistanceKm computes realistic Jakarta/Bandung -> Tokyo distance (~5800 km)', () => {
  const km = greatCircleDistanceKm(-6.9175, 107.6191, 35.6762, 139.6503);
  assert.ok(km > 5500 && km < 6100, `Unexpected Bandung->Tokyo distance: ${km}`);
});

test('sampleGreatCircleArc stays strictly above globe surface and matches endpoints', () => {
  const R = 1.5;
  const start = sampleGreatCircleArc(-6.9175, 107.6191, 48.8566, 2.3522, R, 0, 0.35);
  const mid = sampleGreatCircleArc(-6.9175, 107.6191, 48.8566, 2.3522, R, 0.5, 0.35);
  const end = sampleGreatCircleArc(-6.9175, 107.6191, 48.8566, 2.3522, R, 1, 0.35);

  const rStart = Math.hypot(start.position.x, start.position.y, start.position.z);
  const rMid = Math.hypot(mid.position.x, mid.position.y, mid.position.z);
  const rEnd = Math.hypot(end.position.x, end.position.y, end.position.z);

  assert.ok(Math.abs(rStart - R) < 1e-4);
  assert.ok(rMid > R + 0.25, `Midpoint altitude should arc above surface (${rMid})`);
  assert.ok(Math.abs(rEnd - R) < 1e-4);

  // Tangent must be unit-length and nearly orthogonal to radial normal at midpoint
  const tLen = Math.hypot(mid.tangent.x, mid.tangent.y, mid.tangent.z);
  assert.ok(Math.abs(tLen - 1) < 1e-3);
  const dotTN = mid.tangent.x * mid.normal.x + mid.tangent.y * mid.normal.y + mid.tangent.z * mid.normal.z;
  assert.ok(Math.abs(dotTN) < 0.05);

  const trail = buildGreatCircleArcPoints(-6.9175, 107.6191, 48.8566, 2.3522, R, 32, 0.35);
  assert.equal(trail.length, 33);
});
