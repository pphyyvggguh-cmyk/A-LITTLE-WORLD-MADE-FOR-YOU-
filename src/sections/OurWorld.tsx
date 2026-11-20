import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  ChevronUp,
  Compass,
  MapPin,
  Pause,
  Plane,
  Play,
  RotateCcw,
  X,
} from 'lucide-react';
import { HiddenFlowerSpot } from '../components/Flower';
import { Polaroid } from '../components/Polaroid';
import { WorldDestination } from '../data/destinations';
import { useContentStore } from '../store/useContentStore';
import { useStore } from '../store/useStore';
import {
  buildGreatCircleArcPoints,
  greatCircleDistanceKm,
  latLngToVector3,
  sampleGreatCircleArc,
} from '../utils/geography';
import { createEarthTextures, extractWorldCountryPolygons } from '../utils/earthTexture';
import { EASE_OUT_EXPO } from '../utils/animation';

const GLOBE_RADIUS = 1.45;
const MAX_ARC_HEIGHT = 0.28;

// Pre-allocated scratch math helpers (zero GC inside render loop)
const _up = new THREE.Vector3(0, 1, 0);
const _normal = new THREE.Vector3();
const _tangent = new THREE.Vector3();
const _right = new THREE.Vector3();
const _basis = new THREE.Matrix4();
const _targetCamDir = new THREE.Vector3();
const _curCamDir = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _pointer = new THREE.Vector2();

function buildAirplaneGroup(useLightweightMat = false): THREE.Group {
  const group = new THREE.Group();

  const bodyMat = useLightweightMat
    ? new THREE.MeshLambertMaterial({ color: 0xfbf6ee })
    : new THREE.MeshStandardMaterial({
        color: 0xfbf6ee,
        roughness: 0.45,
        metalness: 0.12,
      });
  const accentMat = useLightweightMat
    ? new THREE.MeshLambertMaterial({ color: 0xa6533b })
    : new THREE.MeshStandardMaterial({
        color: 0xa6533b,
        roughness: 0.35,
        metalness: 0.25,
      });
  const glassMat = useLightweightMat
    ? new THREE.MeshLambertMaterial({ color: 0x38271f })
    : new THREE.MeshStandardMaterial({
        color: 0x38271f,
        roughness: 0.15,
        metalness: 0.6,
      });

  // 1. Fuselage along +Z
  const fuselageGeo = new THREE.CapsuleGeometry(0.018, 0.07, 6, 12);
  fuselageGeo.rotateX(Math.PI / 2);
  const fuselage = new THREE.Mesh(fuselageGeo, bodyMat);
  group.add(fuselage);

  // 2. Nose cone
  const noseGeo = new THREE.ConeGeometry(0.017, 0.028, 12);
  noseGeo.rotateX(Math.PI / 2);
  const nose = new THREE.Mesh(noseGeo, accentMat);
  nose.position.z = 0.052;
  group.add(nose);

  // 3. Cockpit visor
  const cockpitGeo = new THREE.SphereGeometry(0.013, 10, 8);
  const cockpit = new THREE.Mesh(cockpitGeo, glassMat);
  cockpit.scale.set(0.9, 0.65, 1.3);
  cockpit.position.set(0, 0.011, 0.026);
  group.add(cockpit);

  // 4. Main swept wings
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0.018);
  wingShape.lineTo(0.088, -0.014);
  wingShape.lineTo(0.088, -0.028);
  wingShape.lineTo(0, -0.012);
  wingShape.lineTo(-0.088, -0.028);
  wingShape.lineTo(-0.088, -0.014);
  wingShape.closePath();

  const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
    depth: 0.004,
    bevelEnabled: false,
  });
  wingGeo.rotateX(Math.PI / 2);
  const wings = new THREE.Mesh(wingGeo, bodyMat);
  wings.position.set(0, 0.002, 0.006);
  group.add(wings);

  // 5. Tail fin + horizontal stabilizer
  const finGeo = new THREE.BoxGeometry(0.004, 0.028, 0.024);
  const fin = new THREE.Mesh(finGeo, accentMat);
  fin.position.set(0, 0.018, -0.038);
  group.add(fin);

  const stabGeo = new THREE.BoxGeometry(0.048, 0.003, 0.014);
  const stab = new THREE.Mesh(stabGeo, bodyMat);
  stab.position.set(0, 0.006, -0.04);
  group.add(stab);

  return group;
}

function Fallback2DMap({
  destinations,
  selectedId,
  fromId,
  toId,
  onSelect,
}: {
  destinations: WorldDestination[];
  selectedId: string;
  fromId: string;
  toId: string;
  onSelect: (d: WorldDestination) => void;
}) {
  const polygons = useMemo(() => extractWorldCountryPolygons(), []);
  const W = 800;
  const H = 400;

  const project = (lat: number, lng: number) => ({
    x: ((lng + 180) / 360) * W,
    y: ((90 - lat) / 180) * H,
  });

  const from = destinations.find((d) => d.id === fromId) ?? destinations[3];
  const to = destinations.find((d) => d.id === toId) ?? destinations[5];
  const p1 = project(from.lat, from.lng);
  const p2 = project(to.lat, to.lng);

  return (
    <div
      data-no-chapter-swipe="true"
      className="w-full h-full flex items-center justify-center p-4 bg-[#122436]"
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-4xl h-auto rounded-xl border border-[#F4EBDD]/15 bg-[#15314B] shadow-2xl"
        role="img"
        aria-label="Peta dunia interaktif 2D"
      >
        {polygons.map((rings, idx) => {
          const dStr = rings
            .map((ring) =>
              ring
                .map(([lng, lat], i) => {
                  const pt = project(lat, lng);
                  return `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
                })
                .join(' ') + ' Z'
            )
            .join(' ');
          return (
            <path
              key={idx}
              d={dStr}
              fill="#5A7853"
              stroke="#F4EBDD"
              strokeOpacity="0.22"
              strokeWidth="0.6"
            />
          );
        })}

        {/* Flight arc preview */}
        <path
          d={`M ${p1.x} ${p1.y} Q ${(p1.x + p2.x) / 2} ${Math.min(p1.y, p2.y) - 45} ${p2.x} ${p2.y}`}
          fill="none"
          stroke="#C4A574"
          strokeWidth="2"
          strokeDasharray="5 4"
        />

        {destinations.map((dest) => {
          const { x, y } = project(dest.lat, dest.lng);
          const isSel = dest.id === selectedId;
          return (
            <g
              key={dest.id}
              onClick={() => onSelect(dest)}
              className="cursor-pointer"
            >
              <circle
                cx={x}
                cy={y}
                r={isSel ? 7 : 4.5}
                fill={isSel ? '#E8BFC5' : '#A6533B'}
                stroke="#FBF6EE"
                strokeWidth="1.5"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function OurWorld() {
  const destinations = useContentStore((s) => s.destinations);
  const selectedDestinationId = useStore((s) => s.selectedDestinationId);
  const setSelectedDestinationId = useStore((s) => s.setSelectedDestinationId);
  const setOktafDialogue = useStore((s) => s.setOktafDialogue);

  const [cardOpen, setCardOpen] = useState(true);
  const [dockExpanded, setDockExpanded] = useState(true);
  const [dockTab, setDockTab] = useState<'places' | 'flight'>('places');
  const [fromId, setFromId] = useState('bandung');
  const [toId, setToId] = useState('tokyo');
  const [flightPlaying, setFlightPlaying] = useState(true);
  const [webglFailed, setWebglFailed] = useState(false);

  const canvasMountRef = useRef<HTMLDivElement>(null);
  const flightProgressRef = useRef<HTMLSpanElement>(null);

  // Mutable refs for Three.js loop (avoids tearing down WebGL on React state updates)
  const destinationsRef = useRef<WorldDestination[]>(destinations);
  destinationsRef.current = destinations;
  const selectedIdRef = useRef(selectedDestinationId);
  selectedIdRef.current = selectedDestinationId;

  const flightStateRef = useRef({
    fromId,
    toId,
    playing: flightPlaying,
    progress: 0,
    dirtyRoute: true,
  });

  const cameraFocusTargetRef = useRef<THREE.Vector3 | null>(null);
  const requestRenderFnRef = useRef<(() => void) | null>(null);
  const setProgressThrottleRef = useRef(0);

  const selectedDestination = useMemo(
    () =>
      destinations.find((d) => d.id === selectedDestinationId) ??
      destinations[3] ??
      destinations[0],
    [destinations, selectedDestinationId]
  );

  const fromDestination = useMemo(
    () => destinations.find((d) => d.id === fromId) ?? destinations[3] ?? destinations[0],
    [destinations, fromId]
  );
  const toDestination = useMemo(
    () => destinations.find((d) => d.id === toId) ?? destinations[5] ?? destinations[0],
    [destinations, toId]
  );

  const routeDistanceKm = useMemo(
    () =>
      greatCircleDistanceKm(
        fromDestination.lat,
        fromDestination.lng,
        toDestination.lat,
        toDestination.lng
      ),
    [fromDestination, toDestination]
  );

  // Sync flight route params to Three.js ref
  useEffect(() => {
    const prev = flightStateRef.current;
    const routeChanged = prev.fromId !== fromId || prev.toId !== toId;
    prev.fromId = fromId;
    prev.toId = toId;
    prev.playing = flightPlaying;
    if (routeChanged) {
      prev.progress = 0;
      prev.dirtyRoute = true;
      if (flightProgressRef.current) flightProgressRef.current.textContent = '0%';
    }
    requestRenderFnRef.current?.();
  }, [fromId, toId, flightPlaying]);

  const handleSelectDestination = (dest: WorldDestination) => {
    setSelectedDestinationId(dest.id);
    setCardOpen(true);

    // Focus camera gently toward the chosen destination
    const pos = latLngToVector3(dest.lat, dest.lng, 1);
    cameraFocusTargetRef.current = new THREE.Vector3(pos.x, pos.y, pos.z).normalize();
    requestRenderFnRef.current?.();

    setOktafDialogue(
      'globe',
      'wink',
      `${dest.city}, ${dest.country}! "${dest.travelNote}"`
    );
  };

  // Mount Three.js scene ONCE (deferred until transition frame settles so navigation never stalls clicks)
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    let unmounted = false;
    let sceneCleanup: (() => void) | null = null;

    const initTimerId = window.setTimeout(() => {
      if (unmounted) return;
      sceneCleanup = mountWebGLScene();
    }, 180);

    function mountWebGLScene(): (() => void) | null {
      if (!mount) return null;

      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          powerPreference: 'high-performance',
        });
      } catch {
        setWebglFailed(true);
        return null;
      }

      const isSoftwareGl = (() => {
        try {
          const gl = renderer.getContext();
          const ext = gl.getExtension('WEBGL_debug_renderer_info');
          const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
          const gpu = String(gl.getParameter(param));
          return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
        } catch {
          return false;
        }
      })();

      const width = mount.clientWidth || window.innerWidth;
      const height = mount.clientHeight || window.innerHeight - 56;

      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = isSoftwareGl
        ? THREE.NoToneMapping
        : THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      renderer.setPixelRatio(isSoftwareGl ? 0.55 : Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      mount.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglFailed(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c1624);

    // Studio environment map for metallic specular highlights on GPU (skipped on software WebGL for snappy UI)
    if (!isSoftwareGl) {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    }

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    // Start camera facing Indonesia/Asia with comfortable margin around header & dock
    const initDir = latLngToVector3(10, 108, 1);
    camera.position.set(initDir.x * 3.95, initDir.y * 3.95, initDir.z * 3.95);
    camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.minDistance = 2.15;
    controls.maxDistance = 4.9;
    controls.rotateSpeed = 0.65;
    controls.zoomSpeed = 0.75;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;

    // Warm/cool 3-point lighting rig
    const hemiLight = new THREE.HemisphereLight(0xbcd8f2, 0x2a1f1b, 0.95);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1dc, 1.9);
    keyLight.position.set(5, 3.5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x7eb6d9, 0.85);
    rimLight.position.set(-4, -2, -5);
    scene.add(rimLight);

    // Subtle starry backdrop
    const starCount = 420;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 14 + (i % 7) * 2.2;
      const theta = Math.acos(1 - (2 * (i + 0.5)) / starCount);
      const phi = Math.PI * (1 + Math.sqrt(5)) * i;
      starPositions[i * 3] = r * Math.sin(theta) * Math.cos(phi);
      starPositions[i * 3 + 1] = r * Math.cos(theta);
      starPositions[i * 3 + 2] = r * Math.sin(theta) * Math.sin(phi);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xf4ebdd,
      size: 0.06,
      transparent: true,
      opacity: 0.75,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Earth Globe
    const earthTextures = createEarthTextures(
      isSoftwareGl ? 1 : renderer.capabilities.getMaxAnisotropy(),
      isSoftwareGl
    );
    const globeGeo = new THREE.SphereGeometry(
      GLOBE_RADIUS,
      isSoftwareGl ? 32 : 64,
      isSoftwareGl ? 24 : 48
    );
    const globeMat = isSoftwareGl
      ? new THREE.MeshLambertMaterial({
          color: 0xffffff,
          map: earthTextures.dayMap,
        })
      : new THREE.MeshStandardMaterial({
          color: 0xffffff,
          map: earthTextures.dayMap,
          bumpMap: earthTextures.bumpMap,
          bumpScale: 0.025,
          roughness: 0.72,
          metalness: 0.08,
        });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globeMesh);

    // Cloud layer
    const cloudGeo = new THREE.SphereGeometry(
      GLOBE_RADIUS + 0.018,
      isSoftwareGl ? 24 : 48,
      isSoftwareGl ? 18 : 36
    );
    const cloudMat = isSoftwareGl
      ? new THREE.MeshLambertMaterial({
          map: earthTextures.cloudMap,
          transparent: true,
          opacity: 0.65,
          depthWrite: false,
        })
      : new THREE.MeshStandardMaterial({
          map: earthTextures.cloudMap,
          transparent: true,
          opacity: 0.65,
          depthWrite: false,
          roughness: 0.9,
        });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    scene.add(cloudMesh);

    // Subtle Atmospheric Rim Glow
    const atmoGeo = new THREE.SphereGeometry(
      GLOBE_RADIUS + 0.065,
      isSoftwareGl ? 24 : 48,
      isSoftwareGl ? 18 : 36
    );
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x6ca6cd,
      transparent: true,
      opacity: 0.14,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    scene.add(atmoMesh);

    // 20 Geographic Destination Markers
    const markerGroup = new THREE.Group();
    scene.add(markerGroup);

    const hitProxies: THREE.Mesh[] = [];
    const pinHeads = new Map<string, { head: THREE.Mesh; ring: THREE.Mesh }>();

    const stemGeo = new THREE.CylinderGeometry(0.005, 0.003, 0.055, 8);
    const headGeo = new THREE.SphereGeometry(0.022, 10, 8);
    const ringGeo = new THREE.RingGeometry(0.028, 0.04, 20);
    const proxyGeo = new THREE.SphereGeometry(0.085, 8, 8);
    const proxyMat = new THREE.MeshBasicMaterial({ visible: false });

    const defaultHeadMat = isSoftwareGl
      ? new THREE.MeshLambertMaterial({
          color: 0xa6533b,
          emissive: 0x5c2012,
          emissiveIntensity: 0.45,
        })
      : new THREE.MeshStandardMaterial({
          color: 0xa6533b,
          emissive: 0x5c2012,
          emissiveIntensity: 0.45,
          roughness: 0.3,
          metalness: 0.2,
        });
    const activeHeadMat = isSoftwareGl
      ? new THREE.MeshLambertMaterial({
          color: 0xe8bfc5,
          emissive: 0xc4a574,
          emissiveIntensity: 0.9,
        })
      : new THREE.MeshStandardMaterial({
          color: 0xe8bfc5,
          emissive: 0xc4a574,
          emissiveIntensity: 0.9,
          roughness: 0.2,
          metalness: 0.3,
        });
    const stemMat = isSoftwareGl
      ? new THREE.MeshLambertMaterial({ color: 0xf4ebdd })
      : new THREE.MeshStandardMaterial({
          color: 0xf4ebdd,
          roughness: 0.4,
          metalness: 0.5,
        });
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xc4a574,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });

    for (const dest of destinationsRef.current) {
      const surfacePos = latLngToVector3(dest.lat, dest.lng, GLOBE_RADIUS);
      const pin = new THREE.Group();
      pin.position.set(surfacePos.x, surfacePos.y, surfacePos.z);

      _normal.set(surfacePos.x, surfacePos.y, surfacePos.z).normalize();
      pin.quaternion.setFromUnitVectors(_up, _normal);

      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 0.027;
      pin.add(stem);

      const head = new THREE.Mesh(
        headGeo,
        dest.id === selectedIdRef.current ? activeHeadMat : defaultHeadMat
      );
      head.position.y = 0.06;
      pin.add(head);

      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.008;
      ring.visible = dest.id === selectedIdRef.current;
      pin.add(ring);

      const proxy = new THREE.Mesh(proxyGeo, proxyMat);
      proxy.position.y = 0.04;
      proxy.userData.destId = dest.id;
      pin.add(proxy);
      hitProxies.push(proxy);

      pinHeads.set(dest.id, { head, ring });
      markerGroup.add(pin);
    }

    // Airplane & Great-Circle Route Trail
    const airplane = buildAirplaneGroup(isSoftwareGl);
    scene.add(airplane);

    const routeMat = new THREE.LineBasicMaterial({
      color: 0xc4a574,
      transparent: true,
      opacity: 0.85,
    });
    let routeLine: THREE.Line | null = null;

    const rebuildRouteLine = () => {
      if (routeLine) {
        scene.remove(routeLine);
        routeLine.geometry.dispose();
        routeLine = null;
      }
      const list = destinationsRef.current;
      const from =
        list.find((d) => d.id === flightStateRef.current.fromId) ??
        list[3] ??
        list[0];
      const to =
        list.find((d) => d.id === flightStateRef.current.toId) ??
        list[5] ??
        list[0];

      const pts = buildGreatCircleArcPoints(
        from.lat,
        from.lng,
        to.lat,
        to.lng,
        GLOBE_RADIUS + 0.015,
        72,
        MAX_ARC_HEIGHT
      ).map((p) => new THREE.Vector3(p.x, p.y, p.z));

      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      routeLine = new THREE.Line(lineGeo, routeMat);
      scene.add(routeLine);
      flightStateRef.current.dirtyRoute = false;
    };

    rebuildRouteLine();

    // Pointer click/tap selection without triggering during drag
    let downX = 0;
    let downY = 0;
    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
      // Cancel scripted camera fly-to immediately if user touches globe
      cameraFocusTargetRef.current = null;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 7) return;
      const rect = renderer.domElement.getBoundingClientRect();
      _pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      _raycaster.setFromCamera(_pointer, camera);
      const hits = _raycaster.intersectObjects(hitProxies, false);
      if (hits.length > 0) {
        const destId = hits[0].object.userData.destId as string;
        const found = destinationsRef.current.find((d) => d.id === destId);
        if (found) {
          handleSelectDestination(found);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    // Pre-warm shaders on real GPU
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Render loop & Software WebGL afterDraw pacing
    let rafId = 0;
    let timerId = 0;
    let disposed = false;
    let lastTime = performance.now();
    let renderBusy = false;
    let renderDirty = false;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        timerId = window.setTimeout(cb, 260);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          timerId = window.setTimeout(poll, 24);
        } else {
          if (sync) gl.deleteSync(sync);
          timerId = window.setTimeout(cb, 260);
        }
      };
      timerId = window.setTimeout(poll, 24);
    };

    const updateScene = (dt: number) => {
      if (flightStateRef.current.dirtyRoute) {
        rebuildRouteLine();
      }

      // Update active marker visuals
      for (const [id, refs] of pinHeads.entries()) {
        const active = id === selectedIdRef.current;
        refs.head.material = active ? activeHeadMat : defaultHeadMat;
        refs.head.scale.setScalar(active ? 1.38 : 1);
        refs.ring.visible = active;
      }

      // Advance airplane along spherical great-circle route
      const fs = flightStateRef.current;
      if (fs.playing) {
        fs.progress += dt * 0.14;
        if (fs.progress > 1) fs.progress = 0;

        const nowMs = performance.now();
        if (nowMs - setProgressThrottleRef.current > 150) {
          setProgressThrottleRef.current = nowMs;
          if (flightProgressRef.current) {
            flightProgressRef.current.textContent = `${Math.round(fs.progress * 100)}%`;
          }
        }
      }

      const list = destinationsRef.current;
      const from =
        list.find((d) => d.id === fs.fromId) ?? list[3] ?? list[0];
      const to =
        list.find((d) => d.id === fs.toId) ?? list[5] ?? list[0];

      const sample = sampleGreatCircleArc(
        from.lat,
        from.lng,
        to.lat,
        to.lng,
        GLOBE_RADIUS + 0.025,
        fs.progress,
        MAX_ARC_HEIGHT
      );

      airplane.position.set(sample.position.x, sample.position.y, sample.position.z);
      _tangent.set(sample.tangent.x, sample.tangent.y, sample.tangent.z).normalize();
      _normal.set(sample.normal.x, sample.normal.y, sample.normal.z).normalize();
      _right.crossVectors(_normal, _tangent).normalize();
      _normal.crossVectors(_tangent, _right).normalize();
      _basis.makeBasis(_right, _normal, _tangent);
      airplane.quaternion.setFromRotationMatrix(_basis);

      // Smooth cloud drift
      cloudMesh.rotation.y += dt * 0.012;

      // Smooth camera focus damping toward selected destination
      if (cameraFocusTargetRef.current) {
        const dist = camera.position.length();
        _curCamDir.copy(camera.position).normalize();
        const factor = 1 - Math.exp(-5.5 * dt);
        _curCamDir.lerp(cameraFocusTargetRef.current, factor).normalize();
        camera.position.copy(_curCamDir).multiplyScalar(dist);
        camera.lookAt(0, 0, 0);
        if (_curCamDir.distanceTo(cameraFocusTargetRef.current) < 0.015) {
          cameraFocusTargetRef.current = null;
        }
      }

      controls.update();
    };

    const renderFrame = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      updateScene(dt);
      renderer.render(scene, camera);

      const needsContinuous =
        flightStateRef.current.playing || Boolean(cameraFocusTargetRef.current);

      if (isSoftwareGl) {
        if (needsContinuous) {
          afterDraw(() => {
            if (!disposed) rafId = requestAnimationFrame(renderFrame);
          });
        } else {
          afterDraw(() => {
            renderBusy = false;
            if (renderDirty && !disposed) {
              renderDirty = false;
              requestRender();
            }
          });
        }
      } else {
        rafId = requestAnimationFrame(renderFrame);
      }
    };

    const requestRender = () => {
      if (disposed) return;
      if (!isSoftwareGl) return; // GPU already runs continuous loop
      if (flightStateRef.current.playing || cameraFocusTargetRef.current) {
        // Ensure continuous loop wakes up if paused before
        if (!renderBusy) {
          renderBusy = true;
          rafId = requestAnimationFrame(renderFrame);
        }
        return;
      }
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      rafId = requestAnimationFrame(() => {
        renderDirty = false;
        renderFrame();
      });
    };

    requestRenderFnRef.current = requestRender;
    controls.addEventListener('change', requestRender);

    const onResize = () => {
      if (!mount || disposed) return;
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight - 56;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };
    window.addEventListener('resize', onResize);

    // Kick off initial render
    renderBusy = true;
    rafId = requestAnimationFrame(renderFrame);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
      window.removeEventListener('resize', onResize);
      controls.removeEventListener('change', requestRender);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      controls.dispose();
      earthTextures.dispose();
      globeGeo.dispose();
      globeMat.dispose();
      cloudGeo.dispose();
      cloudMat.dispose();
      atmoGeo.dispose();
      atmoMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      stemGeo.dispose();
      headGeo.dispose();
      ringGeo.dispose();
      proxyGeo.dispose();
      proxyMat.dispose();
      defaultHeadMat.dispose();
      activeHeadMat.dispose();
      stemMat.dispose();
      ringMat.dispose();
      routeMat.dispose();
      if (routeLine) routeLine.geometry.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      };
    }

    return () => {
      unmounted = true;
      window.clearTimeout(initTimerId);
      sceneCleanup?.();
    };
  }, []);

  return (
    <main
      className="relative w-full h-[calc(100dvh-3rem)] md:h-[calc(100dvh-3.5rem)] overflow-hidden bg-[#0C1624] text-[#F8F1E8]"
      data-testid="our-world-section"
      data-selected-city={selectedDestination.city}
    >
      {/* Dedicated WebGL Mount Container (never unmounted on HUD state updates) */}
      {!webglFailed ? (
        <div
          ref={canvasMountRef}
          data-testid="earth-canvas-mount"
          data-no-chapter-swipe="true"
          className="absolute inset-0 w-full h-full touch-none"
        />
      ) : (
        <Fallback2DMap
          destinations={destinations}
          selectedId={selectedDestination.id}
          fromId={fromId}
          toId={toId}
          onSelect={handleSelectDestination}
        />
      )}

      {/* Top-Left Editorial Celestial Compass Header + Flower #4 */}
      <div className="pointer-events-none absolute top-3 left-3 sm:top-5 sm:left-6 z-20 flex items-start gap-2.5 sm:gap-3">
        <div className="pointer-events-auto bg-[#121F30]/92 border border-[#C9A879]/35 rounded-xl px-3.5 py-2.5 shadow-lg">
          <div className="flex items-center gap-2 text-xs text-[#C9A879] font-medium tracking-wider uppercase">
            <Compass className="w-3.5 h-3.5" />
            <span>02 · Our World · 20 Destinasi</span>
          </div>
          <p className="mt-0.5 font-hand text-base text-[#F8F1E8]/85 hidden sm:block">
            Putar bola bumi atau pilih kota di bawah untuk melihat kartu Polaroid.
          </p>
        </div>
        <div className="pointer-events-auto mt-1">
          <HiddenFlowerSpot flowerId="flower-forgetmenot" />
        </div>
      </div>

      {/* Selected Travel Polaroid Overlay (positioned cleanly on top-right / mobile sheet) */}
      <AnimatePresence>
        {cardOpen && (
          <motion.div
            key={selectedDestination.id}
            data-no-chapter-swipe="true"
            initial={{ opacity: 0, x: 16, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 16, scale: 0.96 }}
            transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
            className="absolute top-16 right-3 sm:top-5 sm:right-6 z-20 max-w-[250px] sm:max-w-[275px]"
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => setCardOpen(false)}
                aria-label="Tutup kartu Polaroid destinasi"
                className="absolute -top-2 -right-2 z-30 min-w-[40px] min-h-[40px] rounded-full bg-[#552E3D] text-[#FFFDFC] border border-[#C9A879]/45 flex items-center justify-center shadow-md hover:bg-[#3f202c] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <Polaroid
                image={selectedDestination.image}
                title={`${selectedDestination.city}`}
                date={selectedDestination.country}
                caption={selectedDestination.travelNote}
                stamp={selectedDestination.stampLabel}
                tape="gold"
                rotation={1.2}
                size="sm"
                footerExtra={
                  <div className="pt-2 mt-2 border-t border-[#30272A]/12 space-y-2">
                    <p className="text-[11px] text-[#6E5F63] leading-snug">
                      {selectedDestination.description}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-[#6E5F63] tabular-nums">
                        {selectedDestination.lat.toFixed(2)}°, {selectedDestination.lng.toFixed(2)}°
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedDestination.id !== fromId) {
                            setToId(selectedDestination.id);
                            setFlightPlaying(true);
                            setDockTab('flight');
                          }
                        }}
                        className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#4E5D49] text-[#FFFDFC] text-[10px] font-medium hover:bg-[#3e4b3a] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plane className="w-3 h-3" />
                        <span>Terbang ke Sini</span>
                      </button>
                    </div>
                  </div>
                }
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsible Bottom Control Dock (Zero Central Viewport, Bottom Nav, Vinyl & Mini Oktaf Occlusion) */}
      <div
        data-no-chapter-swipe="true"
        className="absolute bottom-[7.75rem] md:bottom-5 left-3 md:left-1/2 md:-translate-x-1/2 z-20 w-[calc(100vw-1.5rem)] md:w-[min(540px,calc(100vw-24rem))]"
      >
        <div className="flex justify-center mb-1.5">
          <button
            type="button"
            onClick={() => setDockExpanded((v) => !v)}
            className="min-h-[40px] px-4 py-1.5 rounded-lg bg-[#121F30]/95 border border-[#C9A879]/35 text-xs font-medium text-[#F8F1E8] inline-flex items-center gap-1.5 shadow-md hover:bg-[#1b2d44] cursor-pointer"
          >
            {dockExpanded ? (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-[#C9A879]" />
                <span>Sembunyikan Kontrol</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-[#C9A879]" />
                <span>Tampilkan Kontrol Peta</span>
              </>
            )}
          </button>
        </div>

        <AnimatePresence>
          {dockExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.22 }}
              className="bg-[#121F30]/95 border border-[#C4A574]/28 rounded-xl p-3 sm:p-3.5 shadow-2xl"
            >
              {/* Dock Tabs + Hidden Flower #5 */}
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#F4EBDD]/12">
                <div className="flex items-center gap-1 bg-[#0C1624] p-1 rounded-lg border border-[#F4EBDD]/10">
                  <button
                    type="button"
                    onClick={() => setDockTab('places')}
                    className={`min-h-[38px] px-3 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                      dockTab === 'places'
                        ? 'bg-[#A6533B] text-[#F4EBDD]'
                        : 'text-[#F4EBDD]/72 hover:text-[#F4EBDD]'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>20 Destinasi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDockTab('flight')}
                    className={`min-h-[38px] px-3 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                      dockTab === 'flight'
                        ? 'bg-[#455342] text-[#F4EBDD]'
                        : 'text-[#F4EBDD]/72 hover:text-[#F4EBDD]'
                    }`}
                  >
                    <Plane className="w-3.5 h-3.5" />
                    <span>Rute Pesawat</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {!cardOpen && (
                    <button
                      type="button"
                      onClick={() => setCardOpen(true)}
                      className="min-h-[38px] px-3 py-1 rounded-md bg-[#F4EBDD]/12 border border-[#C4A574]/30 text-[#F4EBDD] text-[11px] hover:bg-[#F4EBDD]/20 cursor-pointer"
                    >
                      Buka Polaroid
                    </button>
                  )}
                  <HiddenFlowerSpot flowerId="flower-lavender" />
                </div>
              </div>

              {dockTab === 'places' ? (
                <div className="pt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrapbook-scroll">
                  {destinations.map((dest) => {
                    const active = dest.id === selectedDestination.id;
                    return (
                      <button
                        key={dest.id}
                        type="button"
                        onClick={() => handleSelectDestination(dest)}
                        className={`min-h-[42px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#E8BFC5] text-[#38271F] font-semibold'
                            : 'bg-[#0C1624]/85 text-[#F4EBDD]/88 border border-[#F4EBDD]/14 hover:border-[#C4A574]/60'
                        }`}
                      >
                        <span className="tabular-nums opacity-60 mr-1">{dest.order}.</span>
                        {dest.city}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="pt-2.5 flex flex-col gap-2.5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
                    <label className="flex flex-col gap-0.5 text-[10px] text-[#F4EBDD]/68">
                      <span>Dari Kota</span>
                      <select
                        value={fromId}
                        onChange={(e) => setFromId(e.target.value)}
                        aria-label="Kota asal penerbangan"
                        className="min-h-[42px] rounded-lg bg-[#0C1624] border border-[#F4EBDD]/20 px-2 text-xs text-[#F4EBDD]"
                      >
                        {destinations.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.city}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex flex-col gap-0.5 text-[10px] text-[#F4EBDD]/68">
                      <span>Tujuan Kota</span>
                      <select
                        value={toId}
                        onChange={(e) => setToId(e.target.value)}
                        aria-label="Kota tujuan penerbangan"
                        className="min-h-[42px] rounded-lg bg-[#0C1624] border border-[#F4EBDD]/20 px-2 text-xs text-[#F4EBDD]"
                      >
                        {destinations.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.city}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="flex items-center gap-1.5 pt-3.5">
                      <button
                        type="button"
                        onClick={() => setFlightPlaying((p) => !p)}
                        aria-label={flightPlaying ? 'Jeda pesawat' : 'Terbangkan pesawat'}
                        className="flex-1 min-h-[42px] px-3 rounded-lg bg-[#A6533B] text-[#F4EBDD] text-xs font-medium inline-flex items-center justify-center gap-1 hover:bg-[#8e442f] cursor-pointer"
                      >
                        {flightPlaying ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>Jeda</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span>Terbang</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          flightStateRef.current.progress = 0;
                          if (flightProgressRef.current) flightProgressRef.current.textContent = '0%';
                          setFlightPlaying(true);
                          requestRenderFnRef.current?.();
                        }}
                        aria-label="Ulangi rute penerbangan"
                        className="min-w-[42px] min-h-[42px] rounded-lg bg-[#0C1624] border border-[#F4EBDD]/20 text-[#F4EBDD] flex items-center justify-center hover:bg-[#1e3047] cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="pt-3.5 text-right text-xs text-[#C4A574] tabular-nums font-medium">
                      {routeDistanceKm.toLocaleString('id-ID')} km ·{' '}
                      <span ref={flightProgressRef}>0%</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
