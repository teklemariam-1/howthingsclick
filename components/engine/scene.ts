import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  PARTS,
  SYSTEM_COLORS,
  findPart,
  type SystemId,
} from '@/lib/engine/catalog';
import {
  CYLINDER_Z,
  CRANK_RADIUS,
  ROD_LENGTH,
  cylinderPose,
  valveLift,
  advanceCycle,
  assemblyOffset,
  stagedSeparation,
  flowGate,
} from '@/lib/engine/mechanics';
import { sampleTour, type TourVariant } from '@/lib/engine/tour';
import { createVehicleContext } from './vehicle';

export type SceneOptions = {
  playing: boolean;
  speed: number;
  cutaway: boolean;
  explode: number;
  removed: string[];
  selected: string | null;
  isolated: boolean;
  labels: boolean;
  system: SystemId;
  warm: boolean;
  quality: 'balanced' | 'high';
  colors: boolean;
  flows: boolean;
  throttle: number;
  peel: number;
  tourTime: number | null;
  tourVariant: TourVariant;
  carContext: boolean;
};
type V3 = [number, number, number];
type Assembly = {
  group: THREE.Group;
  offset: V3;
  amount: number;
  anchor: THREE.Vector3;
  materials: THREE.MeshStandardMaterial[];
};
const vec = (v: V3) => new THREE.Vector3(...v);

export function createEngineScene(
  host: HTMLElement,
  onSelect: (id: string | null) => void,
  onTick: (cycle: number) => void,
) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#10171e');
  scene.fog = new THREE.Fog('#10171e', 48, 130);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute(
    'aria-label',
    'Interactive 3D four-cylinder engine. Use the part list and camera controls for keyboard navigation.',
  );
  renderer.domElement.setAttribute('role', 'img');
  host.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 180);
  let cameraGoal: THREE.Vector3 | null = null,
    targetGoal: THREE.Vector3 | null = null,
    autoFrame = false;
  const aspectScale = () => Math.max(1, 0.95 / camera.aspect);
  camera.position.set(10.4, 7.0, -12.8);
  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.target.set(-0.5, 1.2, 0);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.075;
  orbit.minDistance = 3;
  orbit.maxDistance = 110;
  orbit.maxPolarAngle = Math.PI * 0.84;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = new RoomEnvironment();
  const env = pmrem.fromScene(environment, 0.04);
  scene.environment = env.texture;
  scene.environmentIntensity = 0.65;
  environment.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#e4f5ef', '#29313e', 1.1));
  const key = new THREE.DirectionalLight('#fff1dd', 3.1);
  key.position.set(5, 10, -4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -11;
  key.shadow.camera.right = 11;
  key.shadow.camera.top = 11;
  key.shadow.camera.bottom = -11;
  key.shadow.camera.far = 40;
  key.shadow.normalBias = 0.025;
  key.shadow.bias = -0.0001;
  scene.add(key);
  const rim = new THREE.DirectionalLight('#c0e8ff', 3);
  rim.position.set(-6, 6, -4);
  scene.add(rim);
  const fill = new THREE.DirectionalLight('#b3c9ce', 1.4);
  fill.position.set(1, 3, -8);
  scene.add(fill);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(150, 150),
    new THREE.MeshStandardMaterial({
      color: '#080d13',
      roughness: 0.83,
      metalness: 0.12,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.48;
  floor.receiveShadow = true;
  scene.add(floor);
  const vehicle = createVehicleContext();
  scene.add(vehicle.group);
  let vehicleOpacity = 0,
    wheelAngle = 0;
  const materials = {
    cast: new THREE.MeshStandardMaterial({
      color: '#727b80',
      metalness: 0.72,
      roughness: 0.47,
    }),
    machined: new THREE.MeshStandardMaterial({
      color: '#c3cecf',
      metalness: 0.92,
      roughness: 0.23,
    }),
    steel: new THREE.MeshStandardMaterial({
      color: '#7e8d92',
      metalness: 1,
      roughness: 0.24,
    }),
    dark: new THREE.MeshStandardMaterial({
      color: '#343c3e',
      metalness: 0.82,
      roughness: 0.31,
    }),
    black: new THREE.MeshStandardMaterial({
      color: '#141e21',
      metalness: 0.25,
      roughness: 0.48,
    }),
    cover: new THREE.MeshStandardMaterial({
      color: '#233b44',
      metalness: 0.68,
      roughness: 0.3,
    }),
    brass: new THREE.MeshStandardMaterial({
      color: '#b99761',
      metalness: 0.87,
      roughness: 0.27,
    }),
    ceramic: new THREE.MeshStandardMaterial({
      color: '#e8e5d9',
      metalness: 0.04,
      roughness: 0.2,
    }),
    rubber: new THREE.MeshStandardMaterial({
      color: '#14181b',
      metalness: 0,
      roughness: 0.84,
    }),
  };
  const grainData = new Uint8Array(128 * 128 * 4);
  let seed = 411;
  for (let i = 0; i < grainData.length; i += 4) {
    seed = (1664525 * seed + 1013904223) >>> 0;
    const g = 150 + (seed % 85);
    grainData[i] = grainData[i + 1] = grainData[i + 2] = g;
    grainData[i + 3] = 255;
  }
  const grain = new THREE.DataTexture(grainData, 128, 128);
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.repeat.set(5, 5);
  grain.needsUpdate = true;
  materials.cast.bumpMap = grain;
  materials.cast.bumpScale = 0.013;
  materials.cast.roughnessMap = grain;
  materials.cover.bumpMap = grain;
  materials.cover.bumpScale = 0.004;
  const root = new THREE.Group();
  scene.add(root);
  const assemblies = new Map<string, Assembly>();
  const meshes: THREE.Mesh[] = [];
  const cutObjects: THREE.Object3D[] = [];
  const linerVariants: { whole: THREE.Mesh; cut: THREE.Mesh }[] = [];
  const sectionVariants: { id: string; whole: THREE.Mesh; cut: THREE.Mesh }[] =
    [];
  const pistons: THREE.Group[] = [];
  const rods: THREE.Group[] = [];
  const ringPacks: THREE.Group[] = [];
  const wristPins: THREE.Group[] = [];
  const rodCaps: THREE.Group[] = [];
  const valves: {
    node: THREE.Group;
    n: number;
    type: 'intake' | 'exhaust';
    y: number;
  }[] = [];
  const cams: THREE.Group[] = [];
  const camGears: THREE.Group[] = [];
  let options: SceneOptions = {
    playing: false,
    speed: 0.32,
    cutaway: false,
    explode: 0,
    removed: [],
    selected: null,
    isolated: false,
    labels: true,
    system: 'all',
    warm: true,
    quality: 'balanced',
    colors: true,
    flows: true,
    throttle: 0.32,
    peel: 0,
    tourTime: null,
    tourVariant: 'full',
    carContext: false,
  };
  let cycle = 28,
    flowClock = 0,
    disposed = false,
    last = performance.now(),
    reported = 0,
    frameId = 0,
    disassemblyProgress = 0;
  const makeAssembly = (id: string, offset: V3) => {
    const group = new THREE.Group();
    group.name = id;
    root.add(group);
    assemblies.set(id, {
      group,
      offset,
      amount: 0,
      anchor: new THREE.Vector3(),
      materials: [],
    });
    return group;
  };
  function mesh(
    parent: THREE.Object3D,
    geometry: THREE.BufferGeometry,
    material: THREE.MeshStandardMaterial,
    p: V3 = [0, 0, 0],
    rotation?: V3,
  ) {
    const mat = material.clone();
    mat.userData.originalColor = material.color.clone();
    const m = new THREE.Mesh(geometry, mat);
    m.position.set(...p);
    if (rotation) m.rotation.set(...rotation);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    meshes.push(m);
    let part: THREE.Object3D | null = parent;
    while (part && !assemblies.has(part.name)) part = part.parent;
    if (part) {
      m.userData.partId = part.name;
      assemblies.get(part.name)!.materials.push(mat);
    }
    return m;
  }
  const box = (
    parent: THREE.Object3D,
    size: V3,
    p: V3,
    material = materials.cast,
    r = 0.045,
  ) =>
    mesh(
      parent,
      new RoundedBoxGeometry(
        ...size,
        2,
        Math.min(r, ...size.map((x) => x / 3)),
      ),
      material,
      p,
    );
  const cylinder = (
    parent: THREE.Object3D,
    r: number,
    h: number,
    p: V3,
    material = materials.steel,
    axis: 'x' | 'y' | 'z' = 'y',
    segments = 40,
  ) =>
    mesh(
      parent,
      new THREE.CylinderGeometry(r, r, h, segments),
      material,
      p,
      axis === 'z'
        ? [Math.PI / 2, 0, 0]
        : axis === 'x'
          ? [0, 0, Math.PI / 2]
          : undefined,
    );
  const ring = (
    parent: THREE.Object3D,
    r: number,
    t: number,
    p: V3,
    material = materials.steel,
    axis: 'x' | 'y' | 'z' = 'z',
  ) =>
    mesh(
      parent,
      new THREE.TorusGeometry(r, t, 8, 48),
      material,
      p,
      axis === 'y'
        ? [Math.PI / 2, 0, 0]
        : axis === 'x'
          ? [0, Math.PI / 2, 0]
          : undefined,
    );
  function tube(
    parent: THREE.Object3D,
    points: V3[],
    radius: number,
    material = materials.steel,
  ) {
    return mesh(
      parent,
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points.map(vec)),
        44,
        radius,
        10,
        false,
      ),
      material,
    );
  }
  function bolt(
    parent: THREE.Object3D,
    p: V3,
    axis: 'x' | 'y' | 'z' = 'y',
    scale = 1,
  ) {
    cylinder(parent, 0.071 * scale, 0.044 * scale, p, materials.steel, axis, 6);
    ring(parent, 0.072 * scale, 0.009 * scale, p, materials.dark, axis);
  }
  function plate(
    parent: THREE.Object3D,
    y: number,
    width: number,
    depth: number,
    h: number,
    holes = true,
  ) {
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, -depth / 2);
    shape.lineTo(width / 2, -depth / 2);
    shape.lineTo(width / 2, depth / 2);
    shape.lineTo(-width / 2, depth / 2);
    shape.closePath();
    if (holes)
      CYLINDER_Z.forEach((z) => {
        const hole = new THREE.Path();
        hole.absarc(0, z, 0.515, 0, Math.PI * 2, true);
        shape.holes.push(hole);
      });
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: h,
      bevelEnabled: true,
      bevelSegments: 1,
      steps: 1,
      bevelSize: 0.014,
      bevelThickness: 0.014,
      curveSegments: 40,
    });
    geometry.rotateX(-Math.PI / 2);
    return mesh(parent, geometry, materials.cast, [0, y, 0]);
  }
  function gear(parent: THREE.Object3D, r: number, p: V3, teeth: number) {
    const group = new THREE.Group();
    group.position.set(...p);
    parent.add(group);
    cylinder(group, r, 0.1, [0, 0, 0], materials.dark, 'z');
    ring(group, r, 0.025, [0, 0, 0.065], materials.steel);
    cylinder(group, 0.13, 0.15, [0, 0, 0], materials.machined, 'z');
    bolt(group, [0, 0, 0.1], 'z', 1.5);
    for (let j = 0; j < teeth; j++) {
      const a = (j / teeth) * Math.PI * 2;
      const b = box(
        group,
        [0.05, 0.045, 0.13],
        [Math.cos(a) * (r + 0.01), Math.sin(a) * (r + 0.01), 0],
        materials.steel,
        0.005,
      );
      b.rotation.z = a;
    }
    for (let j = 0; j < 5; j++) {
      const a = (j / 5) * Math.PI * 2;
      box(
        group,
        [r * 0.58, 0.07, 0.08],
        [Math.cos(a) * r * 0.54, Math.sin(a) * r * 0.54, 0.065],
        materials.cast,
        0.01,
      ).rotation.z = a;
    }
    return group;
  }
  const block = makeAssembly('block', [-2.7, 0.4, 0]);
  plate(block, 0.75, 1.48, 5.72, 0.15);
  plate(block, 2.4, 1.55, 5.72, 0.12);
  [-0.69, 0.69].forEach((x) => {
    const wall = box(block, [0.19, 1.62, 5.75], [x, 1.55, 0]);
    if (x > 0) cutObjects.push(wall);
    for (let i = 0; i < 9; i++) {
      const rib = box(
        block,
        [0.25, 1.38, 0.08],
        [x, 1.52, -2.57 + i * 0.64],
        materials.cast,
        0.014,
      );
      if (x > 0) cutObjects.push(rib);
    }
  });
  [-2.77, 2.77].forEach((z) => {
    box(block, [1.47, 1.65, 0.13], [0, 1.5, z]);
    for (const x of [-0.56, 0.56])
      for (let y = 0.86; y < 2.4; y += 0.42)
        bolt(block, [x, y, z + (z > 0 ? 0.08 : -0.08)], 'z');
  });
  for (const z of [-2.6, -1.3, 0, 1.3, 2.6]) {
    box(block, [1.6, 0.19, 0.23], [0, 0.4, z]);
    for (const x of [-0.61, 0.61]) bolt(block, [x, 0.51, z]);
  }
  const head = makeAssembly('head', [0, 2.1, 0]);
  plate(head, 2.54, 1.63, 5.84, 0.13);
  for (const x of [-0.75, 0.75]) {
    const side = box(head, [0.17, 0.54, 5.79], [x, 2.91, 0]);
    if (x > 0) cutObjects.push(side);
  }
  for (const z of [-2.72, -1.3, 0, 1.3, 2.72])
    for (const x of [-0.36, 0.36]) {
      box(head, [0.23, 0.22, 0.18], [x, 3.38, z]);
      bolt(head, [x, 3.53, z]);
    }
  [-2.82, 2.82].forEach((z) => box(head, [1.55, 0.55, 0.12], [0, 2.91, z]));
  const cover = makeAssembly('cover', [0, 3.65, 0]);
  const coverTop = box(
    cover,
    [1.63, 0.16, 5.88],
    [0, 3.85, 0],
    materials.cover,
    0.065,
  );
  cutObjects.push(coverTop);
  for (const x of [-0.76, 0.76]) {
    const side = box(cover, [0.12, 0.66, 5.8], [x, 3.53, 0], materials.cover);
    cutObjects.push(side);
  }
  for (const z of [-2.82, 2.82])
    cutObjects.push(
      box(cover, [1.6, 0.66, 0.11], [0, 3.53, z], materials.cover),
    );
  const coverBolts = makeAssembly('cover-bolts', [0, 6.25, 0]);
  for (const x of [-0.57, 0.57])
    for (const z of [-2.5, -1.2, 0, 1.2, 2.5]) {
      cylinder(coverBolts, 0.035, 0.2, [x, 3.89, z], materials.steel);
      bolt(coverBolts, [x, 4, z]);
    }
  const sump = makeAssembly('sump', [0, -1.6, 0]);
  box(sump, [1.65, 0.14, 5.83], [0, -1.05, 0]);
  for (const x of [-0.75, 0.75]) {
    const m = box(sump, [0.13, 0.78, 5.7], [x, -0.65, 0]);
    if (x > 0) cutObjects.push(m);
  }
  for (const z of [-2.75, 2.75]) box(sump, [1.55, 0.76, 0.14], [0, -0.65, z]);
  for (let z = -2.4; z <= 2.4; z += 0.4)
    box(sump, [1.56, 0.045, 0.06], [0, -1.16, z], materials.cast, 0.006);
  const sumpBolts = makeAssembly('sump-bolts', [0, -4.5, 0]);
  for (const x of [-0.76, 0.76])
    for (let z = -2.6; z <= 2.6; z += 0.52) {
      bolt(sumpBolts, [x, -0.2, z]);
      cylinder(sumpBolts, 0.025, 0.13, [x, -0.27, z], materials.steel);
    }
  const crankAssembly = makeAssembly('crank', [0, -0.8, 1.2]);
  const crank = new THREE.Group();
  crankAssembly.add(crank);
  for (const z of [-2.58, -1.31, 0, 1.31, 2.58]) {
    cylinder(crank, 0.18, 0.5, [0, 0, z], materials.machined, 'z');
    ring(crank, 0.2, 0.045, [0, 0, z], materials.brass);
  }
  CYLINDER_Z.forEach((z, n) => {
    const phase = n === 0 || n === 3 ? 0 : Math.PI;
    const pin = new THREE.Group();
    pin.rotation.z = phase;
    crank.add(pin);
    cylinder(pin, 0.165, 0.52, [0, CRANK_RADIUS, z], materials.machined, 'z');
    for (const side of [-1, 1]) {
      const web = box(
        pin,
        [0.49, 0.91, 0.14],
        [0, 0.17, z + side * 0.3],
        materials.dark,
        0.13,
      );
      cylinder(
        pin,
        0.4,
        0.18,
        [0, -0.28, z + side * 0.29],
        materials.dark,
        'z',
      );
      web.castShadow = true;
    }
  });
  cylinder(crank, 0.16, 0.6, [0, 0, -3], materials.steel, 'z');
  const flywheelAssembly = makeAssembly('flywheel', [0, 0.1, 2.8]);
  const flywheel = gear(flywheelAssembly, 0.92, [0, 0, 3.09], 64);
  for (let j = 0; j < 6; j++) {
    const a = (j / 6) * Math.PI * 2;
    bolt(flywheel, [Math.cos(a) * 0.32, Math.sin(a) * 0.32, 0.16], 'z');
  }
  const timing = makeAssembly('timing', [0, 0.5, -2.4]);
  const crankGear = gear(timing, 0.18, [0, 0, -3.15], 24);
  for (const x of [-0.39, 0.39])
    camGears.push(gear(timing, 0.36, [x, 3.38, -3.15], 48));
  tube(
    timing,
    [
      [-0.57, 3.72, -3.16],
      [-0.76, 3.35, -3.16],
      [-0.24, 0.23, -3.16],
      [-0.13, -0.18, -3.16],
      [0.13, -0.18, -3.16],
      [0.76, 3.35, -3.16],
      [0.57, 3.72, -3.16],
      [0, 3.76, -3.16],
      [-0.57, 3.72, -3.16],
    ],
    0.031,
    materials.rubber,
  );
  gear(timing, 0.16, [0.62, 1.9, -3.15], 16);
  for (const type of ['intake', 'exhaust'] as const) {
    const g = makeAssembly(`cam-${type}`, [type === 'intake' ? -1 : 1, 2.5, 0]);
    const shaft = new THREE.Group();
    shaft.position.set(type === 'intake' ? -0.36 : 0.36, 3.4, 0);
    g.add(shaft);
    cams.push(shaft);
    cylinder(shaft, 0.085, 5.82, [0, 0, 0], materials.steel, 'z');
    CYLINDER_Z.forEach((z, n) => {
      for (const dz of [-0.18, 0.18]) {
        const firing = [0, 540, 180, 360][n];
        const peak =
          ((firing + (type === 'intake' ? 450 : 270)) * Math.PI) / 360 -
          Math.PI / 2;
        const shape = new THREE.Shape();
        for (let j = 0; j <= 80; j++) {
          const a = (j / 80) * Math.PI * 2;
          const delta = Math.atan2(Math.sin(a - peak), Math.cos(a - peak));
          const lift =
            Math.abs(delta) < Math.PI / 4 ? 0.22 * Math.cos(delta * 2) ** 2 : 0;
          const r = 0.13 + lift;
          const x = Math.cos(a) * r,
            y = Math.sin(a) * r;
          if (j === 0) shape.moveTo(x, y);
          else shape.lineTo(x, y);
        }
        shape.closePath();
        mesh(
          shaft,
          new THREE.ExtrudeGeometry(shape, {
            depth: 0.12,
            bevelEnabled: true,
            bevelSize: 0.008,
            bevelThickness: 0.008,
            bevelSegments: 2,
          }),
          materials.machined,
          [0, 0, z + dz - 0.06],
        );
      }
    });
  }
  CYLINDER_Z.forEach((z, n) => {
    const liners = makeAssembly(`liner-${n + 1}`, [
      n % 2 ? 1.9 : -1.9,
      0.7,
      (n - 1.5) * 0.7,
    ]);
    const full = mesh(
      liners,
      new THREE.CylinderGeometry(0.516, 0.516, 1.81, 56, 1, true),
      materials.machined,
      [0, 1.55, z],
    );
    const cut = mesh(
      liners,
      new THREE.CylinderGeometry(
        0.516,
        0.516,
        1.81,
        56,
        1,
        true,
        Math.PI,
        Math.PI,
      ),
      materials.machined,
      [0, 1.55, z],
    );
    (cut.material as THREE.Material).side = THREE.DoubleSide;
    linerVariants.push({ whole: full, cut });
    const pg = makeAssembly(`piston-${n + 1}`, [
      (n % 2 ? 1 : -1) * 1.6,
      1.15,
      (n - 1.5) * 1.15,
    ]);
    const p = new THREE.Group();
    pg.add(p);
    pistons.push(p);
    p.position.z = z;
    cylinder(p, 0.476, 0.42, [0, 0.035, 0], materials.machined);
    cylinder(p, 0.487, 0.065, [0, 0.278, 0], materials.machined);
    const ringAssembly = makeAssembly(`rings-${n + 1}`, [
      (n % 2 ? 1 : -1) * 2.55,
      3.2,
      (n - 1.5) * 1.65,
    ]);
    const rings = new THREE.Group();
    ringAssembly.add(rings);
    rings.position.z = z;
    ringPacks.push(rings);
    for (const y of [0.155, 0.218, 0.252])
      ring(rings, 0.479, 0.016, [0, y, 0], materials.dark, 'y');
    const pinAssembly = makeAssembly(`pin-${n + 1}`, [
      (n % 2 ? 1 : -1) * 3.9,
      1.8,
      (n - 1.5) * 1.65,
    ]);
    const wp = new THREE.Group();
    pinAssembly.add(wp);
    wp.position.z = z;
    wristPins.push(wp);
    cylinder(wp, 0.105, 0.97, [0, -0.06, 0], materials.steel, 'x');
    for (const side of [-1, 1])
      ring(wp, 0.1, 0.016, [side * 0.485, -0.06, 0], materials.dark, 'x');
    const rg = makeAssembly(`rod-${n + 1}`, [
      (n % 2 ? 1 : -1) * 2.5,
      0,
      (n - 1.5) * 1.15,
    ]);
    const rod = new THREE.Group();
    rg.add(rod);
    rods.push(rod);
    box(rod, [0.15, ROD_LENGTH - 0.3, 0.14], [0, 0, 0], materials.steel, 0.025);
    box(
      rod,
      [0.24, ROD_LENGTH - 0.45, 0.045],
      [0, 0, 0.095],
      materials.machined,
      0.025,
    );
    for (const [y, r] of [
      [-ROD_LENGTH / 2, 0.195],
      [ROD_LENGTH / 2, 0.115],
    ]) {
      ring(rod, r, 0.046, [0, y, 0], materials.machined);
      ring(rod, r - 0.039, 0.018, [0, y, 0.01], materials.brass);
    }
    const capAssembly = makeAssembly(`rod-cap-${n + 1}`, [
      (n % 2 ? 1 : -1) * 3.5,
      -1.8,
      (n - 1.5) * 1.7,
    ]);
    const rc = new THREE.Group();
    capAssembly.add(rc);
    rodCaps.push(rc);
    box(
      rc,
      [0.47, 0.105, 0.2],
      [0, -ROD_LENGTH / 2 - 0.135, 0],
      materials.dark,
    );
    for (const x of [-0.18, 0.18]) bolt(rc, [x, -ROD_LENGTH / 2 - 0.2, 0]);
    const plug = makeAssembly(`plug-${n + 1}`, [0.2, 2.9, (n - 1.5) * 0.85]);
    cylinder(plug, 0.071, 0.32, [0, 3.13, z], materials.ceramic);
    for (let j = 0; j < 5; j++)
      ring(plug, 0.071, 0.009, [0, 3.09 + j * 0.04, z], materials.ceramic, 'y');
    cylinder(plug, 0.09, 0.18, [0, 2.85, z], materials.steel, 'y', 6);
    cylinder(plug, 0.052, 0.2, [0, 2.68, z], materials.steel);
    cylinder(plug, 0.055, 0.09, [0, 3.34, z], materials.black);
    for (const type of ['intake', 'exhaust'] as const) {
      const vg = makeAssembly(
        `${type === 'intake' ? 'inlet' : 'outlet'}-${n + 1}`,
        [type === 'intake' ? -2.3 : 2.3, 2.0, (n - 1.5) * 0.88],
      );
      for (const dz of [-0.17, 0.17]) {
        const v = new THREE.Group();
        v.position.set(type === 'intake' ? -0.25 : 0.25, 2.51, z + dz);
        vg.add(v);
        valves.push({ node: v, n, type, y: 2.51 });
        cylinder(v, 0.151, 0.035, [0, 0, 0], materials.machined);
        cylinder(v, 0.027, 0.65, [0, 0.32, 0], materials.steel);
        cylinder(v, 0.1, 0.035, [0, 0.6, 0], materials.steel);
        const points: V3[] = [];
        for (let k = 0; k <= 100; k++) {
          const a = (k / 100) * Math.PI * 2 * 5;
          points.push([
            Math.cos(a) * 0.071,
            0.25 + (k / 100) * 0.27,
            Math.sin(a) * 0.071,
          ]);
        }
        tube(v, points, 0.009, materials.steel);
      }
    }
  });
  const intake = makeAssembly('intake', [-2.8, 0.4, 0]);
  const exhaust = makeAssembly('exhaust', [2.8, 0.4, 0]);
  const rail = makeAssembly('rail', [-2.2, 1.6, 0]);
  cylinder(intake, 0.28, 4.7, [-1.57, 2.15, 0], materials.black, 'z');
  CYLINDER_Z.forEach((z) => {
    tube(
      intake,
      [
        [-0.72, 2.72, z],
        [-1.16, 2.76, z],
        [-1.67, 2.45, z],
        [-1.57, 2.12, z],
      ],
      0.155,
      materials.black,
    );
    box(intake, [0.1, 0.38, 0.42], [-0.8, 2.71, z], materials.machined);
    tube(
      exhaust,
      [
        [0.73, 2.72, z],
        [1.32, 2.66, z],
        [1.58, 2.03, z * 0.65],
        [1.75, 1.5, z * 0.45],
      ],
      0.125,
      materials.steel,
    );
    box(exhaust, [0.1, 0.34, 0.43], [0.81, 2.71, z], materials.cast);
    cylinder(rail, 0.047, 0.29, [-1.03, 2.91, z], materials.brass);
    box(rail, [0.13, 0.13, 0.17], [-1.03, 3.11, z], materials.black);
  });
  cylinder(rail, 0.055, 4.75, [-1.03, 3.11, 0], materials.machined, 'z');
  cylinder(exhaust, 0.22, 2.4, [1.76, 1.51, 0], materials.steel, 'z');
  cylinder(intake, 0.28, 0.75, [-1.57, 2.15, -2.8], materials.machined, 'z');
  ring(intake, 0.29, 0.034, [-1.57, 2.15, -3.1]);
  const oilpump = makeAssembly('oil-pump', [1.5, -0.7, -1.7]);
  box(oilpump, [0.61, 0.57, 0.23], [0.25, -0.22, -2.5], materials.cast);
  gear(oilpump, 0.16, [0.25, -0.22, -2.67], 8);
  tube(
    oilpump,
    [
      [0.22, -0.34, -2.38],
      [0.2, -0.76, -1.7],
      [0.08, -0.85, -0.8],
    ],
    0.063,
    materials.steel,
  );
  cylinder(oilpump, 0.2, 0.085, [0.08, -0.88, -0.8], materials.dark);
  const filter = makeAssembly('oil-filter', [2.9, -0.3, -0.6]);
  const filterWhole = mesh(
    filter,
    new THREE.CylinderGeometry(0.235, 0.235, 0.67, 48),
    materials.black,
    [1.08, 0.74, -1.6],
  );
  const filterCut = mesh(
    filter,
    new THREE.CylinderGeometry(
      0.235,
      0.235,
      0.67,
      48,
      1,
      true,
      Math.PI,
      Math.PI,
    ),
    materials.black,
    [1.08, 0.74, -1.6],
  );
  filterCut.material.side = THREE.DoubleSide;
  sectionVariants.push({
    id: 'oil-filter',
    whole: filterWhole,
    cut: filterCut,
  });
  for (let j = 0; j < 24; j++) {
    const a = (j / 24) * Math.PI * 2;
    box(
      filter,
      [0.034, 0.44, 0.07],
      [1.08 + Math.cos(a) * 0.15, 0.75, -1.6 + Math.sin(a) * 0.15],
      materials.ceramic,
      0.006,
    ).rotation.y = -a;
  }
  cylinder(filter, 0.072, 0.53, [1.08, 0.75, -1.6], materials.machined);
  ring(filter, 0.22, 0.035, [1.08, 1.07, -1.6], materials.machined, 'y');
  for (let j = 0; j < 10; j++) {
    const a = (j / 10) * Math.PI * 2;
    box(
      filter,
      [0.032, 0.22, 0.055],
      [1.08 + Math.cos(a) * 0.234, 0.48, -1.6 + Math.sin(a) * 0.234],
      materials.black,
      0.006,
    );
  }
  const pump = makeAssembly('water-pump', [-1.7, 0.1, -2]);
  cylinder(pump, 0.29, 0.28, [-0.58, 1.2, -2.98], materials.cast, 'z');
  const impeller = gear(pump, 0.19, [-0.58, 1.2, -3.16], 9);
  const thermostat = makeAssembly('thermostat', [-2, 1.4, -0.4]);
  cylinder(thermostat, 0.23, 0.31, [-0.88, 2.75, 2.6], materials.cast, 'x');
  ring(thermostat, 0.13, 0.025, [-1.05, 2.75, 2.6], materials.brass, 'x');
  const radiator = makeAssembly('radiator', [-2.0, 0, -1.2]);
  box(radiator, [0.23, 2.75, 3.1], [-3.25, 1.12, 0], materials.dark);
  for (let y = -0.1; y < 2.5; y += 0.095)
    box(
      radiator,
      [0.255, 0.028, 2.83],
      [-3.25, y, 0],
      materials.machined,
      0.003,
    );
  for (const z of [-1.48, 1.48])
    box(radiator, [0.33, 2.81, 0.12], [-3.25, 1.12, z], materials.black);
  const fan = new THREE.Group();
  fan.position.set(-3.02, 1.1, 0);
  radiator.add(fan);
  cylinder(fan, 0.2, 0.19, [0, 0, 0], materials.black, 'x');
  for (let j = 0; j < 7; j++) {
    const a = (j / 7) * Math.PI * 2;
    const blade = box(
      fan,
      [0.075, 0.6, 0.22],
      [0, Math.cos(a) * 0.45, Math.sin(a) * 0.45],
      materials.black,
      0.06,
    );
    blade.rotation.x = a;
  }
  const starter = makeAssembly('starter', [1.5, -0.4, 2.2]);
  cylinder(starter, 0.21, 0.7, [0.83, -0.12, 2.54], materials.black, 'z');
  cylinder(starter, 0.24, 0.21, [0.83, -0.12, 2.94], materials.cast, 'z');
  cylinder(starter, 0.11, 0.45, [1.03, 0.1, 2.52], materials.dark, 'z');

  // Complete outer assembly, sealing faces, individual serviceable groups.
  function gasket(
    parent: THREE.Object3D,
    y: number,
    width: number,
    depth: number,
    material = materials.rubber,
  ) {
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, -depth / 2);
    shape.lineTo(width / 2, -depth / 2);
    shape.lineTo(width / 2, depth / 2);
    shape.lineTo(-width / 2, depth / 2);
    shape.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-width / 2 + 0.075, -depth / 2 + 0.075);
    hole.lineTo(-width / 2 + 0.075, depth / 2 - 0.075);
    hole.lineTo(width / 2 - 0.075, depth / 2 - 0.075);
    hole.lineTo(width / 2 - 0.075, -depth / 2 + 0.075);
    hole.closePath();
    shape.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: 0.023,
      bevelEnabled: false,
    });
    g.rotateX(-Math.PI / 2);
    mesh(parent, g, material, [0, y, 0]);
  }
  const lower = makeAssembly('lower-case', [-3.9, -1.1, 0]);
  for (const x of [-0.79, 0.79]) {
    cutObjects.push(
      box(lower, [0.17, 0.93, 5.73], [x, 0.24, 0], materials.cast, 0.075),
    );
    for (let z = -2.55; z < 2.7; z += 0.52)
      cutObjects.push(
        box(lower, [0.25, 0.77, 0.085], [x, 0.28, z], materials.cast, 0.025),
      );
  }
  for (const z of [-2.77, 2.77])
    cutObjects.push(
      box(lower, [1.64, 0.91, 0.15], [0, 0.24, z], materials.cast, 0.075),
    );
  gasket(lower, 0.7, 1.79, 5.91, materials.machined);
  gasket(lower, -0.2, 1.78, 5.91, materials.machined);
  for (const [n, z] of [-2.58, -1.31, 0, 1.31, 2.58].entries()) {
    const cap = makeAssembly(`main-cap-${n + 1}`, [0, -2.2, (n - 2) * 1.5]);
    mesh(
      cap,
      new THREE.TorusGeometry(0.225, 0.09, 12, 36, Math.PI),
      materials.cast,
      [0, 0, z],
      [0, 0, Math.PI],
    );
    for (const x of [-0.32, 0.32]) {
      box(cap, [0.19, 0.22, 0.23], [x, -0.13, z], materials.cast);
      cylinder(cap, 0.035, 0.26, [x, -0.28, z], materials.steel);
      bolt(cap, [x, -0.41, z]);
    }
    mesh(
      cap,
      new THREE.TorusGeometry(0.182, 0.015, 8, 36, Math.PI),
      materials.brass,
      [0, 0, z],
      [0, 0, Math.PI],
    );
  }
  // Cast bosses, freeze plugs, deck seams and lifting eyes distinguish the block.
  for (const x of [-0.8, 0.8])
    for (const z of CYLINDER_Z) {
      const boss = cylinder(
        block,
        0.26,
        0.075,
        [x, 1.69, z],
        materials.dark,
        'x',
      );
      if (x > 0) cutObjects.push(boss);
      const core = cylinder(
        block,
        0.204,
        0.089,
        [x, 1.69, z],
        materials.cast,
        'x',
      );
      if (x > 0) cutObjects.push(core);
      const lip = ring(
        block,
        0.218,
        0.018,
        [x + (x > 0 ? 0.06 : -0.06), 1.69, z],
        materials.machined,
        'x',
      );
      if (x > 0) cutObjects.push(lip);
      for (const dz of [-0.46, 0.46]) {
        const rib = box(
          block,
          [0.23, 1.25, 0.105],
          [x, 1.66, z + dz],
          materials.cast,
          0.02,
        );
        if (x > 0) cutObjects.push(rib);
      }
    }
  for (const z of [-2.6, 2.6]) {
    ring(head, 0.12, 0.05, [-0.82, 3.3, z], materials.cast);
    box(head, [0.16, 0.26, 0.2], [-0.82, 3.14, z], materials.cast);
  }
  const hg = makeAssembly('head-gasket', [0, 2.45, 0]);
  const hgp = plate(hg, 2.53, 1.65, 5.84, 0.025);
  (hgp.material as THREE.MeshStandardMaterial).color.set('#46545a');
  CYLINDER_Z.forEach((z) =>
    ring(hg, 0.529, 0.024, [0, 2.556, z], materials.machined, 'y'),
  );
  for (const x of [-0.63, 0.63])
    for (let z = -2.45; z < 2.5; z += 0.48)
      cylinder(hg, 0.035, 0.031, [x, 2.551, z], materials.dark);
  gasket(makeAssembly('cover-gasket', [0, 4.9, 0]), 3.205, 1.7, 5.89);
  gasket(makeAssembly('sump-gasket', [0, -2.2, 0]), -0.23, 1.79, 5.91);
  const headBolts = makeAssembly('head-bolts', [0, 5.45, 0]);
  for (const x of [-0.6, 0.6])
    for (const z of [-2.54, -1.31, 0, 1.31, 2.54]) {
      cylinder(headBolts, 0.042, 0.66, [x, 2.9, z], materials.steel);
      bolt(headBolts, [x, 3.26, z]);
    }
  // Stiffening ribs on the complete top cover and a raised central coil channel.
  for (const x of [-0.57, 0.57])
    for (let z = -2.45; z < 2.6; z += 0.33)
      cutObjects.push(
        box(cover, [0.13, 0.055, 0.2], [x, 3.96, z], materials.cover, 0.02),
      );
  cutObjects.push(
    box(cover, [0.35, 0.12, 5.2], [0, 3.98, 0], materials.black, 0.035),
  );
  CYLINDER_Z.forEach((z, n) => {
    const coil = makeAssembly(`coil-${n + 1}`, [
      (n % 2 ? 1 : -1) * 0.75,
      5.5,
      (n - 1.5) * 0.75,
    ]);
    box(coil, [0.3, 0.19, 0.4], [0, 4.08, z], materials.black);
    cylinder(coil, 0.091, 0.59, [0, 3.72, z], materials.rubber);
    box(coil, [0.14, 0.09, 0.21], [0.2, 4.08, z], materials.dark);
    bolt(coil, [-0.19, 4.15, z]);
  });
  const cap = makeAssembly('oil-cap', [-1, 5.8, -1.3]);
  cylinder(cap, 0.22, 0.1, [-0.4, 4, -2.22], materials.black);
  ring(cap, 0.19, 0.025, [-0.4, 4.055, -2.22], materials.machined, 'y');
  box(cap, [0.26, 0.035, 0.06], [-0.4, 4.065, -2.22], materials.black, 0.01);
  const tc = makeAssembly('timing-cover', [0, 0.5, -4.7]);
  const coverShape = new THREE.Shape();
  coverShape.moveTo(-0.4, -0.4);
  coverShape.quadraticCurveTo(-0.82, 1.7, -1, 3.43);
  coverShape.quadraticCurveTo(-1, 4.1, 0, 4.1);
  coverShape.quadraticCurveTo(1, 4.1, 1, 3.43);
  coverShape.lineTo(0.55, -0.3);
  coverShape.quadraticCurveTo(0, -0.58, -0.4, -0.4);
  const tcGeo = new THREE.ExtrudeGeometry(coverShape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelSize: 0.055,
    bevelThickness: 0.045,
    bevelSegments: 3,
    steps: 1,
  });
  mesh(tc, tcGeo, materials.black, [0, 0, -3.48]);
  for (const x of [-0.39, 0.39])
    ring(tc, 0.39, 0.026, [x, 3.38, -3.535], materials.dark);
  tube(
    tc,
    [
      [-0.7, 3.25, -3.54],
      [-0.45, 2.1, -3.54],
      [-0.2, 0.4, -3.54],
    ],
    0.027,
    materials.dark,
  );
  for (const [x, y] of [
    [-0.77, 3.66],
    [0.77, 3.66],
    [-0.5, 1.77],
    [0.41, 1.35],
    [0.22, -0.25],
  ])
    bolt(tc, [x, y, -3.56], 'z');
  const bell = makeAssembly('bellhousing', [0, 0, 4.45]);
  const bg = new THREE.CylinderGeometry(1.14, 1.02, 0.5, 64, 1, true);
  bg.rotateX(Math.PI / 2);
  mesh(bell, bg, materials.cast, [0, 0, 3.24]);
  cylinder(bell, 1.14, 0.09, [0, 0, 3.54], materials.cast, 'z');
  ring(bell, 1.16, 0.055, [0, 0, 3.59], materials.machined);
  for (let j = 0; j < 12; j++) {
    const a = (j / 12) * Math.PI * 2;
    const x = Math.cos(a),
      y = Math.sin(a);
    bolt(bell, [x * 1.09, y * 1.09, 3.66], 'z');
    const rib = box(
      bell,
      [0.09, 0.24, 0.38],
      [x * 1.09, y * 1.09, 3.27],
      materials.cast,
      0.015,
    );
    rib.rotation.z = a - Math.PI / 2;
  }
  const shield = makeAssembly('exhaust-shield', [4.3, 0.6, 0]);
  const sg = new THREE.CylinderGeometry(
    1.5,
    1.5,
    4.9,
    28,
    1,
    true,
    Math.PI * 0.1,
    Math.PI * 0.55,
  );
  sg.rotateX(Math.PI / 2);
  mesh(shield, sg, materials.machined, [0.83, 2.03, 0]);
  for (const z of [-1.8, 0, 1.8]) {
    box(shield, [0.23, 0.065, 0.3], [1.69, 3.21, z], materials.dark);
    bolt(shield, [1.69, 3.26, z]);
  }
  const airbox = makeAssembly('airbox', [-4.4, 0, -1.1]);
  box(airbox, [1.08, 0.09, 1.42], [-2.65, 1.4, -3.65], materials.black, 0.05);
  for (const x of [-3.14, -2.16])
    cutObjects.push(
      box(airbox, [0.1, 0.89, 1.42], [x, 1.87, -3.65], materials.black, 0.045),
    );
  for (const z of [-4.31, -2.99])
    cutObjects.push(
      box(airbox, [1.08, 0.89, 0.1], [-2.65, 1.87, z], materials.black, 0.045),
    );
  cutObjects.push(
    box(
      airbox,
      [1.08, 0.1, 1.42],
      [-2.65, 2.34, -3.65],
      materials.black,
      0.055,
    ),
  );
  for (let j = 0; j < 18; j++)
    box(
      airbox,
      [0.85, 0.25, 0.036],
      [-2.65, 2.14, -4.2 + j * 0.064],
      materials.ceramic,
      0.005,
    );
  box(airbox, [1.14, 0.1, 1.5], [-2.65, 2.12, -3.65], materials.dark);
  for (let j = 0; j < 11; j++)
    box(
      airbox,
      [0.83, 0.035, 0.038],
      [-2.65, 2.39, -4.2 + j * 0.11],
      materials.dark,
      0.006,
    );
  for (const z of [-4.27, -3.03])
    for (const x of [-3.16, -2.14])
      box(airbox, [0.1, 0.3, 0.12], [x, 2.05, z], materials.steel, 0.015);
  tube(
    airbox,
    [
      [-2.14, 1.98, -3.72],
      [-1.66, 2.13, -3.68],
      [-1.57, 2.15, -3.25],
    ],
    0.27,
    materials.rubber,
  );
  for (let j = 0; j < 5; j++)
    ring(airbox, 0.276, 0.021, [-1.57, 2.15, -3.3 - j * 0.055], materials.dark);
  const throttleAssembly = makeAssembly('throttle', [-3.1, 0.65, -2.4]);
  const throttleWhole = mesh(
    throttleAssembly,
    new THREE.CylinderGeometry(0.305, 0.305, 0.4, 48, 1, true),
    materials.cast,
    [-1.57, 2.15, -3.1],
    [Math.PI / 2, 0, 0],
  );
  const throttleCut = mesh(
    throttleAssembly,
    new THREE.CylinderGeometry(0.305, 0.305, 0.4, 48, 1, true, 0, Math.PI),
    materials.cast,
    [-1.57, 2.15, -3.1],
    [Math.PI / 2, 0, 0],
  );
  throttleWhole.material.side = throttleCut.material.side = THREE.DoubleSide;
  sectionVariants.push({
    id: 'throttle',
    whole: throttleWhole,
    cut: throttleCut,
  });
  ring(throttleAssembly, 0.279, 0.04, [-1.57, 2.15, -3.33], materials.machined);
  box(throttleAssembly, [0.3, 0.36, 0.4], [-1.94, 2.15, -3.1], materials.black);
  const butterfly = new THREE.Group();
  butterfly.position.set(-1.57, 2.15, -3.35);
  throttleAssembly.add(butterfly);
  cylinder(butterfly, 0.264, 0.018, [0, 0, 0], materials.brass, 'z');
  cylinder(
    throttleAssembly,
    0.022,
    0.62,
    [-1.57, 2.15, -3.35],
    materials.steel,
    'x',
  );
  const hoses = makeAssembly('coolant-hoses', [-3.3, 0.8, 1.7]);
  tube(
    hoses,
    [
      [-1.05, 2.75, 2.6],
      [-1.6, 2.85, 2.58],
      [-2.68, 2.65, 1.45],
      [-3.14, 2.35, 1.39],
    ],
    0.113,
    materials.rubber,
  );
  tube(
    hoses,
    [
      [-3.15, -0.12, -1.35],
      [-2.64, -0.22, -2.27],
      [-1.22, 0.12, -3.1],
      [-0.58, 1.2, -3.0],
    ],
    0.105,
    materials.rubber,
  );
  tube(
    hoses,
    [
      [-1.05, 2.65, 2.6],
      [-1.1, 1.98, 1.5],
      [-1.1, 1.35, -1.5],
      [-0.58, 1.2, -2.95],
    ],
    0.07,
    materials.rubber,
  );
  const tank = makeAssembly('expansion-tank', [-4.5, 1.7, 2.4]);
  box(tank, [0.62, 0.87, 0.72], [-2.36, 2.07, 2.82], materials.ceramic, 0.15);
  cylinder(tank, 0.13, 0.09, [-2.36, 2.55, 2.82], materials.black);
  tube(
    tank,
    [
      [-2.36, 1.66, 2.82],
      [-2.35, 1.15, 1.5],
      [-3.1, 0.2, 1.4],
    ],
    0.048,
    materials.rubber,
  );
  const dipstick = makeAssembly('dipstick', [2.5, 1.1, -2.4]);
  tube(
    dipstick,
    [
      [1.05, -0.7, -2],
      [1.11, 0.5, -2.2],
      [1.28, 2.13, -2.3],
    ],
    0.022,
    materials.steel,
  );
  ring(dipstick, 0.1, 0.035, [1.28, 2.27, -2.3], materials.brass);
  const pcv = makeAssembly('pcv', [-2.8, 3.0, 1.8]);
  cylinder(pcv, 0.1, 0.12, [-0.67, 3.97, 2.4], materials.black);
  tube(
    pcv,
    [
      [-0.67, 3.97, 2.4],
      [-1.06, 3.97, 2.4],
      [-1.48, 3.24, 1.4],
      [-1.57, 2.4, 1.4],
    ],
    0.067,
    materials.rubber,
  );
  const alternator = makeAssembly('alternator', [2.8, -0.3, -3.6]);
  cylinder(alternator, 0.39, 0.65, [1.38, 0.4, -2.93], materials.cast, 'z');
  ring(alternator, 0.39, 0.055, [1.38, 0.4, -3.3], materials.machined);
  for (let j = 0; j < 16; j++) {
    const a = (j / 16) * Math.PI * 2;
    const x = 1.38 + Math.cos(a) * 0.35,
      y = 0.4 + Math.sin(a) * 0.35;
    box(
      alternator,
      [0.095, 0.09, 0.55],
      [x, y, -2.94],
      materials.dark,
      0.008,
    ).rotation.z = a;
  }
  cylinder(alternator, 0.26, 0.06, [1.38, 0.4, -2.57], materials.brass, 'z');
  box(alternator, [0.2, 0.2, 0.27], [1.71, 0.56, -2.7], materials.black);
  const accessory = makeAssembly('accessory-belt', [1.25, 0, -4.2]);
  const accessoryCrank = gear(accessory, 0.32, [0, 0, -3.65], 24);
  const altPulley = gear(accessory, 0.17, [1.38, 0.4, -3.65], 18);
  const pumpPulley = gear(accessory, 0.24, [-0.58, 1.2, -3.65], 24);
  tube(
    accessory,
    [
      [0, -0.34, -3.65],
      [1.48, 0.2, -3.65],
      [1.55, 0.51, -3.65],
      [-0.5, 1.45, -3.65],
      [-0.83, 1.21, -3.65],
      [-0.32, 0, -3.65],
      [0, -0.34, -3.65],
    ],
    0.035,
    materials.rubber,
  );
  // A small harness connects the coils and injectors without obscuring the mechanism.
  tube(
    cover,
    [
      [-0.42, 4.03, -2.35],
      [-0.42, 4.06, 0],
      [-0.42, 4.03, 2.35],
    ],
    0.033,
    materials.rubber,
  );
  CYLINDER_Z.forEach((z) =>
    tube(
      cover,
      [
        [-0.42, 4.04, z],
        [-0.16, 4.1, z],
        [0, 4.1, z],
      ],
      0.02,
      materials.rubber,
    ),
  );

  const shellIds = new Set([
    'cover',
    'timing-cover',
    'exhaust-shield',
    'lower-case',
    'bellhousing',
    'cover-bolts',
    'coil-1',
    'coil-2',
    'coil-3',
    'coil-4',
    'oil-cap',
    'pcv',
  ]);
  const offsets: Record<string, V3> = {
    cover: [0, 5, 0],
    head: [0, 3.5, 0],
    sump: [0, -3.2, 0],
    block: [-2.6, 0.25, 0],
    crank: [0, -1.15, 0.3],
    flywheel: [0, 0, 3.2],
    timing: [0, 0.4, -3.3],
    'cam-intake': [-1.0, 4.0, 0],
    'cam-exhaust': [1.0, 4.0, 0],
    intake: [-3.7, 0.45, 0],
    exhaust: [3.6, 0.45, 0],
    rail: [-2.4, 2, 0],
    radiator: [-3.1, 0, 0],
  };
  for (const [id, offset] of Object.entries(offsets))
    assemblies.get(id)!.offset = offset;
  for (const [id, a] of assemblies) {
    if (id.startsWith('piston-'))
      a.offset = [a.offset[0], 2.05, a.offset[2] * 1.35];
    if (id.startsWith('liner-'))
      a.offset = [a.offset[0] * 1.8, 0.6, a.offset[2] * 2.1];
  }
  const missing = PARTS.filter((p) => !assemblies.has(p.id));
  if (missing.length)
    throw new Error(`Missing assembly: ${missing.map((p) => p.id).join(', ')}`);

  // Batch static surfaces inside each moving group. This preserves all assembly
  // and animation pivots while avoiding a draw call per bolt, fin and gear tooth.
  const cutSet = new Set(cutObjects),
    variantSet = new Set(
      [...linerVariants, ...sectionVariants].flatMap((v) => [v.whole, v.cut]),
    );
  const groups: THREE.Object3D[] = [];
  root.traverse((o) => {
    if (o instanceof THREE.Group) groups.push(o);
  });
  for (const parent of groups) {
    const buckets = new Map<
      string,
      THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>[]
    >();
    for (const child of [...parent.children]) {
      if (
        !(child instanceof THREE.Mesh) ||
        variantSet.has(child) ||
        Array.isArray(child.material)
      )
        continue;
      const m = child as THREE.Mesh<
        THREE.BufferGeometry,
        THREE.MeshStandardMaterial
      >;
      const mat = m.material;
      const key = [
        m.userData.partId,
        mat.color.getHex(),
        mat.metalness,
        mat.roughness,
        mat.bumpScale,
        mat.bumpMap?.uuid,
        cutSet.has(m),
      ].join(':');
      const list = buckets.get(key) ?? [];
      list.push(m);
      buckets.set(key, list);
    }
    for (const list of buckets.values()) {
      if (list.length < 2) continue;
      const geometries = list.map((m) => {
        m.updateMatrix();
        const copy = m.geometry.clone().applyMatrix4(m.matrix);
        if (!copy.index) return copy;
        const unindexed = copy.toNonIndexed();
        copy.dispose();
        return unindexed;
      });
      const merged = mergeGeometries(geometries);
      geometries.forEach((g) => g.dispose());
      if (!merged) continue;
      const first = list[0];
      const combined = new THREE.Mesh(merged, first.material);
      combined.userData = { ...first.userData };
      combined.castShadow = true;
      combined.receiveShadow = true;
      parent.add(combined);
      if (cutSet.has(first)) cutSet.add(combined);
      for (const m of list) {
        parent.remove(m);
        cutSet.delete(m);
        m.geometry.dispose();
        if (m !== first) m.material.dispose();
      }
    }
  }
  meshes.length = 0;
  cutObjects.length = 0;
  cutObjects.push(...cutSet);
  assemblies.forEach((a) => (a.materials = []));
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      meshes.push(o);
      const a = assemblies.get(o.userData.partId);
      if (a && !Array.isArray(o.material))
        a.materials.push(o.material as THREE.MeshStandardMaterial);
    }
  });

  const processRoot = new THREE.Group();
  root.add(processRoot);
  type Flow = {
    system: 'oil' | 'cooling' | 'combustion';
    kind: 'oil' | 'cooling' | 'air' | 'fuel' | 'exhaust';
    curve: THREE.CatmullRomCurve3;
    root: THREE.Group;
    dots: THREE.Mesh[];
    variant: 'all' | 'warm' | 'cold';
    cylinder?: number;
  };
  const flows: Flow[] = [];
  function flow(
    kind: Flow['kind'],
    points: V3[],
    color: string,
    variant: 'all' | 'warm' | 'cold' = 'all',
    cylinderIndex?: number,
  ) {
    const curve = new THREE.CatmullRomCurve3(points.map(vec));
    const group = new THREE.Group();
    processRoot.add(group);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      depthTest: false,
    });
    const line = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 64, 0.037, 7, false),
      material,
    );
    line.renderOrder = 8;
    group.add(line);
    const dots: THREE.Mesh[] = [];
    const dotGeo = new THREE.ConeGeometry(0.063, 0.19, 8);
    dotGeo.rotateX(Math.PI / 2);
    const dotMat = new THREE.MeshBasicMaterial({ color, depthTest: false });
    for (let j = 0; j < 12; j++) {
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.renderOrder = 9;
      group.add(dot);
      dots.push(dot);
    }
    flows.push({
      system: kind === 'oil' || kind === 'cooling' ? kind : 'combustion',
      kind,
      curve,
      root: group,
      dots,
      variant,
      cylinder: cylinderIndex,
    });
  }
  flow(
    'oil',
    [
      [0.08, -0.82, -0.8],
      [0.2, -0.76, -1.7],
      [0.25, -0.22, -2.5],
      [0.7, 0.28, -2],
      [1.08, 1.05, -1.6],
      [0.52, 0.82, -1.6],
      [0.52, 0.72, 2.5],
    ],
    '#f3bb60',
  );
  for (const z of CYLINDER_Z) {
    flow(
      'oil',
      [
        [0.52, 0.72, z],
        [0.43, 0.4, z],
        [0, 0, z],
      ],
      '#f3bb60',
    );
    flow(
      'oil',
      [
        [0.52, 0.72, z],
        [0.56, 1.65, z],
        [0.56, 3.12, z],
        [-0.36, 3.36, z],
      ],
      '#f3bb60',
    );
    flow(
      'oil',
      [
        [-0.65, 3.1, z],
        [-0.66, 2.1, z],
        [-0.6, 0.5, z],
        [-0.4, -0.9, z],
      ],
      '#ad7835',
    );
  }
  flow(
    'cooling',
    [
      [-0.58, 1.2, -2.95],
      [-0.7, 1.5, -2.4],
      [-0.67, 1.6, -1.2],
      [-0.67, 1.6, 0],
      [-0.67, 1.6, 1.3],
      [-0.64, 1.6, 2.35],
      [-0.64, 2.7, 2.55],
    ],
    '#69dbe7',
  );
  for (const z of CYLINDER_Z)
    flow(
      'cooling',
      [
        [-0.66, 1.6, z],
        [-0.4, 2.2, z - 0.45],
        [0.4, 2.2, z - 0.45],
        [0.64, 1.6, z],
        [0.4, 1.0, z + 0.45],
        [-0.4, 1.0, z + 0.45],
        [-0.66, 1.6, z],
      ],
      '#69dbe7',
    );
  flow(
    'cooling',
    [
      [-0.64, 2.7, 2.55],
      [-1.4, 2.75, 2.55],
      [-2.75, 2.48, 1.4],
      [-3.1, 2.3, 1.3],
      [-3.08, 0.05, 1.3],
      [-3.06, -0.1, -1.3],
      [-1.55, 0.3, -2.9],
      [-0.58, 1.2, -2.95],
    ],
    '#58c4e0',
    'warm',
  );
  flow(
    'cooling',
    [
      [-0.64, 2.7, 2.55],
      [-1.05, 2.0, 1.5],
      [-1.05, 1.35, -1.5],
      [-0.58, 1.2, -2.95],
    ],
    '#c2a4fd',
    'cold',
  );
  flow(
    'air',
    [
      [-3, 1.86, -3.65],
      [-2.55, 1.95, -3.65],
      [-1.6, 2.15, -3.5],
      [-1.57, 2.15, -2.75],
      [-1.57, 2.15, 2.35],
    ],
    '#61e5dc',
  );
  flow(
    'fuel',
    [
      [-1.04, 3.11, 2.45],
      [-1.04, 3.11, 0],
      [-1.04, 3.11, -2.45],
    ],
    '#f17ac5',
  );
  CYLINDER_Z.forEach((z, n) => {
    flow(
      'air',
      [
        [-1.57, 2.15, z],
        [-1.67, 2.45, z],
        [-1.16, 2.76, z],
        [-0.7, 2.72, z],
        [-0.25, 2.5, z],
        [0, 2.2, z],
      ],
      '#61e5dc',
      'all',
      n,
    );
    flow(
      'fuel',
      [
        [-1.03, 3.11, z],
        [-1.03, 2.91, z],
        [-0.8, 2.7, z],
        [-0.25, 2.5, z],
        [0, 2.2, z],
      ],
      '#f17ac5',
      'all',
      n,
    );
    flow(
      'exhaust',
      [
        [0, 2.2, z],
        [0.25, 2.5, z],
        [0.73, 2.72, z],
        [1.32, 2.66, z],
        [1.58, 2.03, z * 0.65],
        [1.76, 1.51, z * 0.45],
        [1.76, 1.51, 2.65],
      ],
      '#b89af9',
      'all',
      n,
    );
  });
  const combustion = CYLINDER_Z.map((z) => {
    const gas = new THREE.Mesh(
      new THREE.CylinderGeometry(0.465, 0.465, 1, 32),
      new THREE.MeshBasicMaterial({
        color: '#f7bb67',
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      }),
    );
    gas.position.z = z;
    processRoot.add(gas);
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 10, 10),
      new THREE.MeshBasicMaterial({ color: '#fff4c8' }),
    );
    spark.position.set(0, 2.52, z);
    processRoot.add(spark);
    const flameMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: { progress: { value: 0 }, clock: { value: 0 } },
      vertexShader: `varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `varying vec3 vP;uniform float progress;uniform float clock;float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}void main(){float n=noise(vP*13.+vec3(0,clock*5.,0));float front=progress*2.4-.25;float radial=length(vP.xz)/.47;float distanceFromPlug=length(vec3(vP.x,(.5-vP.y)*.8,vP.z));float body=1.-smoothstep(front-.18,front+.08,distanceFromPlug+n*.1);float fade=1.-smoothstep(.65,1.,progress);float core=pow(max(0.,1.-distanceFromPlug*2.),3.);vec3 color=mix(vec3(1.,.13,.015),vec3(1.,.82,.25),n*.7+core*.3);float opacity=body*fade*(.26+n*.35)*(1.-radial*.25);gl_FragColor=vec4(color,opacity);}`,
    });
    const flame = new THREE.Mesh(
      new THREE.CylinderGeometry(0.47, 0.47, 1, 36, 12, true),
      flameMaterial,
    );
    flame.position.z = z;
    flame.renderOrder = 6;
    processRoot.add(flame);
    return { gas, spark, flame };
  });
  const labelRoot = document.createElement('div');
  labelRoot.className = 'model-labels';
  host.appendChild(labelRoot);
  const labelNodes = new Map<string, HTMLButtonElement>();
  const activeLabels = () =>
    options.selected
      ? [options.selected]
      : options.explode > 0.1
        ? [
            'cover',
            'head',
            'head-gasket',
            'block',
            'piston-1',
            'crank',
            'sump',
            'timing-cover',
          ]
        : options.system === 'oil'
          ? ['oil-pump', 'oil-filter', 'sump']
          : options.system === 'cooling'
            ? ['water-pump', 'radiator', 'thermostat']
            : options.system === 'combustion'
              ? ['airbox', 'throttle', 'rail']
              : options.system === 'timing'
                ? ['cam-intake', 'timing']
                : options.cutaway
                  ? ['piston-1', 'crank']
                  : ['cover', 'timing-cover'];
  function rebuildLabels() {
    labelRoot.replaceChildren();
    labelNodes.clear();
    if (!options.labels) return;
    for (const id of activeLabels()) {
      const part = findPart(id);
      if (!part) continue;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'model-label';
      b.textContent = part.name;
      b.addEventListener('click', () => onSelect(id));
      labelRoot.appendChild(b);
      labelNodes.set(id, b);
    }
  }
  const point = new THREE.Vector3();
  const bounds = new THREE.Box3();
  function restyle() {
    for (const [id, a] of assemblies) {
      const part = findPart(id)!;
      const match = options.system === 'all' || part.system === options.system;
      const selected = options.selected === id;
      a.group.visible = options.isolated && options.selected ? selected : true;
      const ghost =
        options.system !== 'all' && !match && !selected && !options.isolated;
      for (const mat of a.materials) {
        const original = mat.userData.originalColor as THREE.Color;
        mat.color.copy(original);
        if (
          options.colors &&
          part.system !== 'mechanics' &&
          !(options.system === 'mechanics' && part.system === 'oil') &&
          mat.metalness > 0.1
        )
          mat.color.lerp(
            new THREE.Color(SYSTEM_COLORS[part.system]),
            match && options.system !== 'all' ? 0.3 : 0.05,
          );
        if (ghost) mat.color.lerp(new THREE.Color('#273641'), 0.72);
        mat.envMapIntensity = ghost ? 0.15 : 1;
        mat.emissive.set(
          selected
            ? '#74dbbe'
            : match && options.system !== 'all'
              ? SYSTEM_COLORS[part.system]
              : '#000000',
        );
        mat.emissiveIntensity = selected ? 0.19 : 0.025;
        mat.transparent = ghost;
        mat.opacity = ghost ? 0.075 : 1;
        mat.depthWrite = !ghost;
        mat.needsUpdate = true;
      }
    }
    rebuildLabels();
  }
  function updatePose() {
    crank.rotation.z = (-cycle * Math.PI) / 180;
    flywheel.rotation.z = (-cycle * Math.PI) / 180;
    crankGear.rotation.z = crank.rotation.z;
    cams.forEach((c) => (c.rotation.z = (-cycle * Math.PI) / 360));
    camGears.forEach((c) => (c.rotation.z = (-cycle * Math.PI) / 360));
    impeller.rotation.z = crank.rotation.z;
    fan.rotation.x = (cycle * Math.PI) / 72;
    accessoryCrank.rotation.z = crank.rotation.z;
    altPulley.rotation.z = crank.rotation.z * 1.88;
    pumpPulley.rotation.z = crank.rotation.z * 1.33;
    butterfly.rotation.x = 0.13 + options.throttle * 1.37;
    CYLINDER_Z.forEach((z, n) => {
      const pose = cylinderPose(cycle, n);
      pistons[n].position.y = pose.pinY;
      rods[n].position.set(pose.crankX / 2, (pose.crankY + pose.pinY) / 2, z);
      rods[n].rotation.z = pose.rodAngle;
      ringPacks[n].position.y = pose.pinY;
      wristPins[n].position.y = pose.pinY;
      rodCaps[n].position.copy(rods[n].position);
      rodCaps[n].rotation.copy(rods[n].rotation);
      const { gas, spark, flame } = combustion[n];
      const height = Math.max(0.035, 2.51 - (pose.pinY + 0.315));
      gas.position.y = 2.51 - height / 2;
      gas.scale.y = height;
      flame.position.y = gas.position.y;
      flame.scale.y = height;
      const material = gas.material as THREE.MeshBasicMaterial;
      material.color.set(
        pose.phase < 180
          ? '#ff742f'
          : pose.phase < 360
            ? '#b89af9'
            : pose.phase < 540
              ? '#61e5dc'
              : '#f17ac5',
      );
      material.opacity = pose.phase < 180 ? 0.24 : 0.27;
      gas.visible =
        options.flows &&
        options.cutaway &&
        options.explode < 0.01 &&
        options.removed.length === 0 &&
        !options.isolated &&
        ['all', 'mechanics', 'combustion'].includes(options.system);
      spark.visible = gas.visible && pose.phase < 18;
      spark.scale.setScalar(1 + Math.sin((pose.phase / 18) * Math.PI) * 1.3);
      flame.visible = gas.visible && pose.phase < 145;
      flame.material.uniforms.progress.value = pose.phase / 180;
      flame.material.uniforms.clock.value = flowClock;
    });
    valves.forEach(
      (v) =>
        (v.node.position.y =
          v.y - valveLift(cylinderPose(cycle, v.n).phase, v.type)),
    );
  }
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (width <= 0 || height <= 0) return;
    renderer.setSize(width, height);
    const previousScale = aspectScale();
    camera.aspect = width / height;
    const factor = aspectScale() / previousScale;
    camera.position.sub(orbit.target).multiplyScalar(factor).add(orbit.target);
    if (cameraGoal && targetGoal)
      cameraGoal.sub(targetGoal).multiplyScalar(factor).add(targetGoal);
    camera.updateProjectionMatrix();
    if (
      options.carContext &&
      options.system === 'all' &&
      options.explode === 0 &&
      options.removed.length === 0
    )
      frameAssembly(true);
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();
  restyle();
  updatePose();
  const pointerStart = { x: 0, y: 0 };
  const raycaster = new THREE.Raycaster();
  const down = (event: PointerEvent) => {
    pointerStart.x = event.clientX;
    pointerStart.y = event.clientY;
  };
  const up = (event: PointerEvent) => {
    if (
      Math.hypot(
        event.clientX - pointerStart.x,
        event.clientY - pointerStart.y,
      ) > 5
    )
      return;
    const rect = renderer.domElement.getBoundingClientRect();
    raycaster.setFromCamera(
      new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      ),
      camera,
    );
    const hit = raycaster.intersectObjects(meshes, false).find((h) => {
      if (
        (
          h.object as THREE.Mesh<
            THREE.BufferGeometry,
            THREE.MeshStandardMaterial
          >
        ).material.opacity < 0.2
      )
        return false;
      let p: THREE.Object3D | null = h.object;
      while (p) {
        if (!p.visible) return false;
        p = p.parent;
      }
      return true;
    });
    onSelect(hit?.object.userData.partId ?? null);
  };
  renderer.domElement.addEventListener('pointerdown', down);
  renderer.domElement.addEventListener('pointerup', up);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let capture: {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    stream: MediaStream;
  } | null = null;
  const cameraDirection = new THREE.Vector3(1, 0.52, -1.28).normalize();
  function frameAssembly(vehicleView = false, direction = cameraDirection) {
    const subject = vehicleView ? vehicle.group : root;
    subject.updateMatrixWorld(true);
    bounds.setFromObject(subject);
    const center = bounds.getCenter(new THREE.Vector3());
    const right = new THREE.Vector3()
        .crossVectors(new THREE.Vector3(0, 1, 0), direction)
        .normalize(),
      up = new THREE.Vector3().crossVectors(direction, right).normalize();
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)),
      tanH = tanV * camera.aspect;
    let distance = 0;
    for (const x of [bounds.min.x, bounds.max.x])
      for (const y of [bounds.min.y, bounds.max.y])
        for (const z of [bounds.min.z, bounds.max.z]) {
          const corner = new THREE.Vector3(x, y, z).sub(center);
          distance = Math.max(
            distance,
            corner.dot(direction) +
              Math.max(
                Math.abs(corner.dot(up)) / tanV,
                Math.abs(corner.dot(right)) / tanH,
              ),
          );
        }
    targetGoal = center;
    cameraGoal = center
      .clone()
      .add(
        direction
          .clone()
          .multiplyScalar(Math.max(12, distance * (vehicleView ? 1.16 : 1.06))),
      );
  }
  const stopCamera = () => {
    if (options.tourTime === null) {
      cameraGoal = null;
      targetGoal = null;
      autoFrame = false;
    }
  };
  orbit.addEventListener('start', stopCamera);
  let lastExpand = false;
  function drawCapture() {
    if (!capture) return;
    const { canvas, ctx } = capture;
    ctx.fillStyle = '#10171e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const w = renderer.domElement.width,
      h = renderer.domElement.height;
    const scale = Math.min(canvas.width / w, (canvas.height - 110) / h);
    ctx.drawImage(
      renderer.domElement,
      (canvas.width - w * scale) / 2,
      40,
      w * scale,
      h * scale,
    );
    ctx.fillStyle = '#eef6fa';
    ctx.font = '600 26px Arial';
    ctx.fillText('how things click.', 42, 43);
    const sample =
      options.tourTime === null
        ? null
        : sampleTour(options.tourTime, options.tourVariant);
    if (sample) {
      ctx.fillStyle = '#93dace';
      ctx.font = '600 25px Arial';
      ctx.fillText(sample.shot.title, 42, canvas.height - 103);
      ctx.fillStyle = '#e6eef2';
      ctx.font = '24px Arial';
      const words = sample.shot.narration.split(' ');
      let line = '',
        lines: string[] = [];
      for (const word of words) {
        if (ctx.measureText(line + word).width > canvas.width - 84) {
          lines.push(line.trim());
          line = '';
        }
        line += word + ' ';
      }
      lines.push(line.trim());
      lines
        .slice(0, 3)
        .forEach((line, i) =>
          ctx.fillText(line, 42, canvas.height - 71 + i * 29),
        );
      if (sample.shot.view === 'invite') {
        ctx.textAlign = 'right';
        ctx.fillStyle = '#9ce6d6';
        ctx.font = '600 25px Arial';
        ctx.fillText('Try it at howthingsclick.com', canvas.width - 42, 43);
        ctx.textAlign = 'left';
      }
    }
  }
  function animate(now: number) {
    if (disposed) return;
    frameId = requestAnimationFrame(animate);
    const dt = Math.min((now - last) / 1000, 0.06);
    last = now;
    if (document.hidden) return;
    const returned = [...assemblies.values()].every((a) => a.amount < 0.001);
    const carVisible =
      options.carContext &&
      options.system === 'all' &&
      options.explode === 0 &&
      options.removed.length === 0 &&
      !options.isolated &&
      options.peel === 0;
    vehicleOpacity = THREE.MathUtils.damp(
      vehicleOpacity,
      carVisible ? 1 : 0,
      5,
      dt,
    );
    vehicle.setOpacity(vehicleOpacity);
    if (options.tourTime !== null) {
      const s = sampleTour(options.tourTime, options.tourVariant);
      cycle = options.explode > 0.01 ? 28 : (options.tourTime * 174) % 720;
      flowClock = options.tourTime;
      const expanded = s.shot.view === 'explode' || s.shot.view === 'assemble';
      const radius =
        (expanded
          ? 32
          : s.shot.view === 'peel'
            ? 24
            : s.shot.view === 'cooling'
              ? 19
              : 17) * aspectScale();
      const a =
        -0.92 +
        (s.shot.view === 'exterior'
          ? s.u * 0.72
          : s.shot.view === 'invite'
            ? s.u * 0.32
            : 0.1 * Math.sin(s.u * Math.PI));
      targetGoal = new THREE.Vector3(
        s.shot.view === 'cooling' ? -1.4 : -0.4,
        expanded ? 2 : 1.5,
        0,
      );
      cameraGoal = targetGoal
        .clone()
        .add(
          new THREE.Vector3(
            Math.cos(a) * radius,
            radius * 0.41,
            Math.sin(a) * radius,
          ),
        );
      if (carVisible)
        frameAssembly(
          true,
          new THREE.Vector3(Math.cos(a), 0.41, Math.sin(a)).normalize(),
        );
    } else if (
      options.playing &&
      options.explode === 0 &&
      options.removed.length === 0 &&
      returned
    ) {
      cycle = advanceCycle(cycle, dt, options.speed);
      flowClock += dt;
      wheelAngle -= dt * options.speed * (1.8 + options.throttle * 2.4);
    }
    vehicle.setWheelAngle(
      options.tourTime === null ? wheelAngle : -options.tourTime * 0.8,
    );
    updatePose();
    if (reduced.matches || options.tourTime !== null)
      disassemblyProgress = options.explode;
    else
      disassemblyProgress +=
        Math.sign(options.explode - disassemblyProgress) *
        Math.min(Math.abs(options.explode - disassemblyProgress), dt * 0.26);
    let maxAmount = 0,
      settled = Math.abs(disassemblyProgress - options.explode) < 0.001;
    for (const [id, a] of assemblies) {
      const target = options.removed.includes(id)
        ? 1
        : Math.max(
            stagedSeparation(id, disassemblyProgress),
            shellIds.has(id) ? options.peel : 0,
          );
      a.amount = reduced.matches
        ? target
        : THREE.MathUtils.damp(a.amount, target, 5, dt);
      if (Math.abs(a.amount - target) < 0.0002) a.amount = target;
      if (Math.abs(a.amount - target) > 0.001) settled = false;
      maxAmount = Math.max(maxAmount, a.amount);
      a.group.position.set(...(assemblyOffset(a.offset, a.amount) as V3));
      if (shellIds.has(id))
        a.group.visible =
          options.isolated && options.selected
            ? options.selected === id
            : !options.cutaway || a.amount > 0.015;
    }
    cutObjects.forEach((m) => {
      const a = assemblies.get((m as THREE.Mesh).userData.partId);
      m.visible = !options.cutaway || (a?.amount ?? 0) > 0.015;
    });
    linerVariants.forEach(({ whole, cut }, n) => {
      const separated = assemblies.get(`liner-${n + 1}`)!.amount > 0.015;
      whole.visible = !options.cutaway || separated;
      cut.visible = options.cutaway && !separated;
    });
    sectionVariants.forEach(({ id, whole, cut }) => {
      const separated = assemblies.get(id)!.amount > 0.015;
      whole.visible = !options.cutaway || separated;
      cut.visible = options.cutaway && !separated;
    });
    floor.position.y = -1.48 - maxAmount * 4.6;
    const expanded = options.explode > 0.01 || options.removed.length > 0;
    if (options.tourTime === null && expanded && autoFrame) {
      frameAssembly();
      if (settled) autoFrame = false;
    } else if (options.tourTime === null && lastExpand && !expanded) {
      targetGoal = new THREE.Vector3(-0.5, 1.2, 0);
      cameraGoal = new THREE.Vector3(10.4, 7, -12.8)
        .sub(targetGoal)
        .multiplyScalar(aspectScale())
        .add(targetGoal);
      if (carVisible) frameAssembly(true);
    }
    lastExpand = expanded;
    for (const f of flows) {
      f.root.visible =
        options.flows &&
        (options.system === f.system ||
          options.system === 'all' ||
          (options.system === 'mechanics' && f.system === 'combustion')) &&
        options.explode < 0.01 &&
        maxAmount < 0.01 &&
        options.removed.length === 0 &&
        !options.isolated &&
        (f.variant === 'all' || f.variant === (options.warm ? 'warm' : 'cold'));
      if (f.root.visible) {
        const phase =
          f.cylinder === undefined ? 0 : cylinderPose(cycle, f.cylinder).phase;
        const enabled =
          f.cylinder === undefined ||
          flowGate(f.kind as 'air' | 'fuel' | 'exhaust', phase);
        f.dots.forEach((d, i) => {
          d.visible = enabled;
          const speed =
            f.system === 'combustion' ? 0.16 + options.throttle * 0.34 : 0.2;
          const t = (i / f.dots.length + flowClock * speed) % 1;
          d.position.copy(f.curve.getPoint(t));
          d.lookAt(d.position.clone().add(f.curve.getTangent(t)));
        });
      }
    }
    if (cameraGoal && targetGoal) {
      camera.position.lerp(
        cameraGoal,
        reduced.matches ? 1 : 1 - Math.exp(-3 * dt),
      );
      orbit.target.lerp(
        targetGoal,
        reduced.matches ? 1 : 1 - Math.exp(-3 * dt),
      );
    }
    orbit.update();
    root.updateMatrixWorld(true);
    const rect = host.getBoundingClientRect();
    const occupied: { x: number; y: number }[] = [];
    for (const [id, b] of labelNodes) {
      const a = assemblies.get(id)!;
      if (!a.group.visible) {
        b.hidden = true;
        continue;
      }
      bounds.setFromObject(a.group);
      bounds.getCenter(point);
      point.project(camera);
      const x = (point.x * 0.5 + 0.5) * rect.width;
      const y = (-point.y * 0.5 + 0.5) * rect.height;
      b.hidden =
        point.z > 1 ||
        x < 15 ||
        x > rect.width - 15 ||
        y < 35 ||
        y > rect.height - 30;
      let left = Math.max(10, Math.min(rect.width - 210, x + 24)),
        top = Math.max(45, y - 30);
      for (
        let i = 0;
        i < 8 &&
        occupied.some(
          (p) => Math.abs(p.x - left) < 215 && Math.abs(p.y - top) < 37,
        );
        i++
      )
        top += 38;
      b.hidden = b.hidden || top > rect.height - 55;
      occupied.push({ x: left, y: top });
      b.style.left = `${left}px`;
      b.style.top = `${top}px`;
    }
    renderer.render(scene, camera);
    drawCapture();
    if (now - reported > 100) {
      onTick(cycle);
      renderer.domElement.dataset.assemblies = String(assemblies.size);
      renderer.domElement.dataset.separation = maxAmount.toFixed(3);
      renderer.domElement.dataset.settled = String(settled);
      renderer.domElement.dataset.flowRoutes = String(
        flows.filter((f) => f.root.visible).length,
      );
      renderer.domElement.dataset.drawCalls = String(
        renderer.info.render.calls,
      );
      renderer.domElement.dataset.carVisible = String(carVisible);
      renderer.domElement.dataset.wheelAngle = wheelAngle.toFixed(4);
      reported = now;
    }
  }
  frameId = requestAnimationFrame(animate);
  return {
    setOptions(next: SceneOptions) {
      const prev = options;
      options = { ...next };
      const removalChanged = prev.removed.join() !== next.removed.join();
      if (prev.explode !== next.explode || removalChanged) autoFrame = true;
      if (prev.tourTime !== null && next.tourTime === null) {
        cameraGoal = null;
        targetGoal = null;
      }
      if (
        ['selected', 'isolated', 'labels', 'system', 'cutaway', 'colors'].some(
          (k) =>
            prev[k as keyof SceneOptions] !== next[k as keyof SceneOptions],
        ) ||
        removalChanged ||
        prev.explode > 0.1 !== next.explode > 0.1
      )
        restyle();
      if (
        prev.system !== next.system &&
        next.tourTime === null &&
        next.explode === 0
      ) {
        targetGoal = new THREE.Vector3(
          next.system === 'cooling' ? -1.25 : -0.5,
          1.2,
          0,
        );
        cameraGoal = new THREE.Vector3(
          ...((next.system === 'cooling' || next.system === 'combustion'
            ? [-11, 6.5, -12]
            : [10.4, 7, -12.8]) as V3),
        )
          .sub(targetGoal)
          .multiplyScalar(aspectScale())
          .add(targetGoal);
      }
      if (prev.quality !== next.quality)
        renderer.setPixelRatio(
          Math.min(window.devicePixelRatio, next.quality === 'high' ? 2 : 1.5),
        );
      if (
        next.tourTime === null &&
        (prev.carContext !== next.carContext || prev.system !== next.system)
      ) {
        if (
          next.carContext &&
          next.system === 'all' &&
          next.explode === 0 &&
          next.removed.length === 0
        )
          frameAssembly(true);
        else if (prev.carContext !== next.carContext && next.explode === 0) {
          targetGoal = new THREE.Vector3(-0.5, 1.2, 0);
          cameraGoal = new THREE.Vector3(10.4, 7, -12.8)
            .sub(targetGoal)
            .multiplyScalar(aspectScale())
            .add(targetGoal);
        }
      }
      orbit.enabled = next.tourTime === null;
    },
    seek(value: number) {
      cycle = value;
      updatePose();
      onTick(cycle);
    },
    camera(
      preset: 'home' | 'front' | 'top' | 'focus' | 'zoom-in' | 'zoom-out',
    ) {
      cameraGoal = null;
      targetGoal = null;
      if (preset === 'zoom-in' || preset === 'zoom-out') {
        camera.position
          .sub(orbit.target)
          .multiplyScalar(preset === 'zoom-in' ? 0.82 : 1.22)
          .add(orbit.target);
        return;
      }
      if (preset === 'focus' && options.selected) {
        const a = assemblies.get(options.selected)!;
        bounds.setFromObject(a.group);
        const center = bounds.getCenter(new THREE.Vector3());
        const size = bounds.getSize(new THREE.Vector3()).length();
        orbit.target.copy(center);
        camera.position
          .copy(center)
          .add(
            new THREE.Vector3(1, 0.7, 1)
              .normalize()
              .multiplyScalar(Math.max(2, size * 1.6)),
          );
      } else {
        orbit.target.set(-0.5, 1.2, 0);
        camera.position.set(
          ...((preset === 'front'
            ? [16, 4, 0]
            : preset === 'top'
              ? [0.01, 20, 0.01]
              : [10.4, 7, -12.8]) as V3),
        );
        camera.position
          .sub(orbit.target)
          .multiplyScalar(aspectScale())
          .add(orbit.target);
        if (options.explode > 0) frameAssembly();
        else if (
          options.carContext &&
          options.system === 'all' &&
          preset === 'home'
        )
          frameAssembly(true);
      }
      orbit.update();
    },
    captureStream() {
      if (capture) capture.stream.getTracks().forEach((t) => t.stop());
      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 900;
      const ctx = canvas.getContext('2d');
      if (!ctx || !canvas.captureStream)
        throw new Error('Recording is unavailable in this browser.');
      capture = { canvas, ctx, stream: canvas.captureStream(30) };
      return capture.stream;
    },
    stopCapture() {
      capture?.stream.getTracks().forEach((t) => t.stop());
      capture = null;
    },
    dispose() {
      disposed = true;
      capture?.stream.getTracks().forEach((t) => t.stop());
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      orbit.removeEventListener('start', stopCamera);
      orbit.dispose();
      renderer.domElement.removeEventListener('pointerdown', down);
      renderer.domElement.removeEventListener('pointerup', up);
      const geometries = new Set<THREE.BufferGeometry>();
      const mats = new Set<THREE.Material>();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
          geometries.add(obj.geometry);
          (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(
            (m) => mats.add(m),
          );
        }
      });
      geometries.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      Object.values(materials).forEach((m) => m.dispose());
      grain.dispose();
      env.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      labelRoot.remove();
    },
  };
}
