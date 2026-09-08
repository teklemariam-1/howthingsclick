import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createVehicleStudioEnvironment } from '@/components/engine/vehicle-studio';
import { drawRecordingBrand } from '@/lib/brand';
import type { TourPose } from '@/lib/self-driving/tour';
import type { SteeringSample } from '@/lib/self-driving/steering';
import type { ControlDetail } from '@/lib/self-driving/motor-driver';
import { drawSteeringReadout } from './steering-readout';
import { createPedestrian } from './pedestrian';
import {
  laneAt,
  blockedByVan,
  type Frame,
  type Settings,
  type View,
  type CameraView,
} from '@/lib/self-driving/simulation';
import { box, material, cylinder, line, createCybercab } from './geometry';
import { createAutonomyHardware } from './hardware';
import {
  steeringAt,
  type Assembly,
  type SystemId,
} from '@/lib/self-driving/engineering';
export interface Display {
  frame: Frame;
  settings: Settings;
  view: View;
  camera: CameraView;
  doors: boolean;
  night: boolean;
  tourPose?: TourPose;
  steering?: SteeringSample;
  controlDetail?: ControlDetail;
  engineering?: boolean;
  system?: SystemId;
  assembly?: Assembly;
}
export function createDrivingScene(
  host: HTMLElement,
  onSelect?: (id: SystemId) => void,
) {
  const scene = new T.Scene();
  scene.background = new T.Color('#17252c');
  scene.fog = new T.Fog('#17252c', 42, 92);
  const renderer = new T.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.domElement.setAttribute(
    'aria-label',
    'Interactive 3D self-driving car simulation',
  );
  renderer.domElement.setAttribute('role', 'img');
  host.appendChild(renderer.domElement);
  const camera = new T.PerspectiveCamera(42, 1, 0.08, 150);
  camera.position.set(-9, 8, 15);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.minDistance = 3.8;
  controls.maxDistance = 40;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.enablePan = true;
  const pmrem = new T.PMREMGenerator(renderer),
    env = createVehicleStudioEnvironment(pmrem);
  scene.environment = env.texture;
  scene.environmentIntensity = 0.8;
  pmrem.dispose();
  const ambient = new T.HemisphereLight('#ddedf5', '#485344', 2.0);
  scene.add(ambient);
  const sun = new T.DirectionalLight('#fff0d3', 3.6);
  sun.position.set(-12, 25, 16);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -32;
  sun.shadow.camera.right = 32;
  sun.shadow.camera.top = 25;
  sun.shadow.camera.bottom = -25;
  sun.shadow.camera.far = 80;
  sun.shadow.normalBias = 0.035;
  sun.shadow.bias = -0.0002;
  scene.add(sun);
  scene.add(sun.target);
  const world = new T.Group();
  scene.add(world);
  const asphalt = material('#3b4346', 0, 0.98),
    paving = material('#828e8d', 0, 0.92),
    curb = material('#b0b9b1', 0, 0.86),
    paint = material('#d2d5bf', 0, 0.83),
    iron = material('#233638', 0.45, 0.45);
  // A subtle generated noise texture gives the road a physical surface.
  const texCanvas = document.createElement('canvas');
  texCanvas.width = 128;
  texCanvas.height = 128;
  const tx = texCanvas.getContext('2d')!;
  const pixels = tx.createImageData(128, 128);
  let seed = 15;
  for (let i = 0; i < pixels.data.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    const a = 110 + (seed % 45);
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = a;
    pixels.data[i + 3] = 255;
  }
  tx.putImageData(pixels, 0, 0);
  const noise = new T.CanvasTexture(texCanvas);
  noise.wrapS = noise.wrapT = T.RepeatWrapping;
  noise.repeat.set(40, 10);
  noise.colorSpace = T.SRGBColorSpace;
  asphalt.map = noise;
  asphalt.roughnessMap = noise;
  box(world, [110, 0.12, 10], [6, -0.08, 0], asphalt, 0);
  box(world, [10, 0.13, 48], [7, -0.075, 0], asphalt, 0);
  for (const z of [-6.1, 6.1])
    for (const [x, w] of [
      [-17, 38],
      [35, 44],
    ]) {
      box(world, [w, 0.25, 3], [x, -0.02, z], paving, 0.02);
      box(world, [w, 0.23, 0.16], [x, 0.025, Math.sign(z) * 4.62], curb, 0.02);
      for (let dx = -w / 2; dx < w / 2; dx += 2)
        line(
          world,
          [
            [x + dx, 0.115, z - 1.5],
            [x + dx, 0.115, z + 1.5],
          ],
          '#717d7d',
          0.4,
        );
    }
  for (let x = -42; x < 60; x += 3.7)
    if (x < 2 || x > 12) box(world, [1.8, 0.012, 0.1], [x, 0.004, 0], paint, 0);
  for (const z of [-4.15, 4.15])
    for (const [x, w] of [
      [-19, 42],
      [36, 46],
    ])
      box(world, [w, 0.012, 0.08], [x, 0.004, z], paint, 0);
  for (let z = -3.8; z < 4.3; z += 0.8)
    box(world, [2, 0.014, 0.42], [5, 0.008, z], paint, 0);
  box(world, [0.17, 0.014, 3.6], [2.05, 0.009, 2.05], paint, 0);
  function sign(
    text: string,
    x: number,
    y: number,
    z: number,
    width: number,
    color = '#cbd9d2',
  ) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 100;
    const c = canvas.getContext('2d')!;
    c.fillStyle = '#243335';
    c.fillRect(0, 0, 512, 100);
    c.fillStyle = color;
    c.font = '600 40px Arial';
    c.textAlign = 'center';
    c.fillText(text, 256, 65);
    const map = new T.CanvasTexture(canvas);
    map.colorSpace = T.SRGBColorSpace;
    const mesh = new T.Mesh(
      new T.PlaneGeometry(width, width / 5.12),
      new T.MeshBasicMaterial({ map }),
    );
    mesh.position.set(x, y, z);
    world.add(mesh);
  }
  const windowMat = new T.MeshStandardMaterial({
    color: '#263f46',
    metalness: 0.65,
    roughness: 0.22,
  });
  for (const [x, z, w, h, d, color] of [
    [-16, -11, 9, 10, 7, '#687772'],
    [-5, -11, 9, 7, 6, '#817963'],
    [20, -12, 10, 13, 9, '#53696d'],
    [33, -12, 12, 8, 8, '#6f7a77'],
    [-28, -11, 10, 14, 8, '#556367'],
  ] as [number, number, number, number, number, string][]) {
    const stone = material(color, 0, 0.88);
    box(world, [w, h, d], [x, h / 2, z], stone, 0.04);
    box(world, [w + 0.12, 0.13, d + 0.12], [x, h, z], curb, 0.02);
    for (let row = 1.2; row < h - 0.8; row += 2.15)
      for (let col = -w / 2 + 0.95; col < w / 2 - 0.6; col += 1.6) {
        box(
          world,
          [1.1, 1.44, 0.05],
          [x + col, row, z + d / 2 + 0.02],
          windowMat,
          0,
        );
        box(
          world,
          [1.25, 0.055, 0.14],
          [x + col, row - 0.72, z + d / 2 + 0.05],
          curb,
          0.005,
        );
      }
  }
  sign('CLICK COFFEE', -5, 2.6, -7.94, 5.2);
  sign('THE CURIOUS BOOKSHOP', -16, 2.6, -7.44, 7);
  const leaf = material('#3e6956', 0, 0.95),
    bark = material('#62564a', 0, 0.95);
  for (const [x, z] of [
    [-21, -6],
    [-10, -6],
    [15, -6],
    [27, -6],
    [-22, 6],
    [19, 6],
    [32, 6],
  ]) {
    cylinder(world, 0.075, 0.11, 2.1, [x, 1.15, z], bark, 8);
    for (const [dx, dy, dz, r] of [
      [0, 0, 0, 0.9],
      [-0.5, 0.1, 0.2, 0.65],
      [0.45, 0.2, -0.2, 0.7],
      [0, 0.65, 0, 0.67],
    ]) {
      const foliage = new T.Mesh(new T.IcosahedronGeometry(r, 2), leaf);
      foliage.position.set(x + dx, 2.6 + dy, z + dz);
      foliage.scale.y = 1.2;
      foliage.castShadow = true;
      world.add(foliage);
    }
    box(world, [1.45, 0.26, 1.45], [x, 0.24, z], iron, 0.045);
  }
  for (const x of [-15, 0, 17, 33]) {
    cylinder(world, 0.035, 0.06, 4.9, [x, 2.55, -5.1], iron, 12);
    box(world, [0.1, 0.08, 1.25], [x, 4.99, -4.58], iron, 0.02);
    box(
      world,
      [0.27, 0.06, 0.57],
      [x, 4.93, -4.05],
      new T.MeshStandardMaterial({
        color: '#ffedd2',
        emissive: '#ffe1aa',
        emissiveIntensity: 1.3,
      }),
      0.02,
    );
  }
  const van = new T.Group();
  world.add(van);
  van.position.set(1, 0, -3.4);
  const vanPaint = material('#bec5be', 0.38, 0.42),
    dark = material('#18272d', 0.15, 0.35);
  box(van, [3.6, 1.72, 2.1], [0, 1.06, 0], vanPaint, 0.15);
  box(van, [0.09, 0.62, 1.87], [1.806, 1.51, 0], windowMat, 0.04);
  for (const z of [-1.06, 1.06]) {
    box(van, [0.7, 0.61, 0.025], [1.1, 1.47, z], windowMat, 0.025);
    line(
      van,
      [
        [-1.1, 0.45, z],
        [-1.1, 1.86, z],
        [0.55, 1.86, z],
        [0.55, 0.45, z],
      ],
      '#566866',
      0.6,
    );
  }
  for (const x of [-1.08, 1.12])
    for (const z of [-0.99, 0.99]) {
      const w = cylinder(van, 0.34, 0.34, 0.19, [x, 0.34, z], dark, 24);
      w.rotation.x = Math.PI / 2;
      const hub = cylinder(van, 0.19, 0.19, 0.21, [x, 0.34, z], curb, 20);
      hub.rotation.x = Math.PI / 2;
    }
  const person = createPedestrian(() => dead);
  const pedestrian = person.group;
  world.add(pedestrian);
  const roadworks = new T.Group();
  const coneOrange = material('#dc9262', 0, 0.9);
  world.add(roadworks);
  for (const [x, z] of [
    [1, 1.6],
    [3, 1.0],
    [3, 2.6],
    [5, 1.0],
    [5, 2.6],
    [7, 1.6],
  ]) {
    box(roadworks, [0.46, 0.045, 0.46], [x, 0.03, z], dark, 0.02);
    cylinder(roadworks, 0.045, 0.17, 0.52, [x, 0.3, z], coneOrange, 16);
    cylinder(roadworks, 0.085, 0.11, 0.105, [x, 0.4, z], paint, 16);
  }
  box(
    roadworks,
    [2.5, 0.18, 1.3],
    [4, 0.14, 1.7],
    material('#615446', 0, 1),
    0.04,
  );
  const trafficLight = new T.Group();
  world.add(trafficLight);
  trafficLight.position.set(7, 0, -4.4);
  cylinder(trafficLight, 0.045, 0.065, 3.8, [0, 1.9, 0], iron, 12);
  box(trafficLight, [0.33, 0.91, 0.21], [0, 3.45, 0.04], dark, 0.06);
  const lights: T.MeshStandardMaterial[] = [];
  for (let i = 0; i < 3; i++) {
    const m = new T.MeshStandardMaterial({
      color: ['#ff5547', '#e6b764', '#83e3a3'][i],
      emissive: ['#ff342b', '#b96b13', '#51fb8e'][i],
      emissiveIntensity: 0,
    });
    const disc = cylinder(
      trafficLight,
      0.094,
      0.094,
      0.022,
      [0, 3.7 - i * 0.25, 0.165],
      m,
      24,
    );
    disc.rotation.x = Math.PI / 2;
    lights.push(m);
  }
  const car = createCybercab();
  const detailReady = Promise.all([car.loadDetailed(() => dead), person.ready]);
  scene.add(car.group);
  const hardware = createAutonomyHardware();
  scene.add(hardware.group);
  let lastDisplay: Display | null = null;
  const raycaster = new T.Raycaster(),
    pointer = new T.Vector2();
  let down = [0, 0];
  const pointerDown = (e: PointerEvent) => {
    down = [e.clientX, e.clientY];
  };
  const pointerUp = (e: PointerEvent) => {
    if (
      !lastDisplay?.engineering ||
      lastDisplay.tourPose !== undefined ||
      lastDisplay.assembly === 'assembled' ||
      Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5
    )
      return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      (-(e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(hardware.picks, false).find((h) => {
      let o: T.Object3D | null = h.object;
      while (o) {
        if (!o.visible) return false;
        o = o.parent;
      }
      return true;
    });
    if (hit) onSelect?.(hit.object.userData.system as SystemId);
  };
  renderer.domElement.addEventListener('pointerdown', pointerDown);
  renderer.domElement.addEventListener('pointerup', pointerUp);
  const plinth = cylinder(
    scene,
    3.8,
    4,
    0.1,
    [0, -0.065, 0],
    material('#394a4f', 0.15, 0.62),
    96,
  );
  plinth.visible = false;
  const detection = new T.Box3Helper(
    new T.Box3(new T.Vector3(-0.32, 0, -0.3), new T.Vector3(0.32, 1.74, 0.3)),
    new T.Color('#78dcec'),
  );
  scene.add(detection);
  const rayGeometry = new T.BufferGeometry();
  rayGeometry.setAttribute(
    'position',
    new T.BufferAttribute(new Float32Array(32 * 6), 3),
  );
  const rays = new T.LineSegments(
    rayGeometry,
    new T.LineBasicMaterial({
      color: '#74d9e8',
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    }),
  );
  scene.add(rays);
  const trail = new T.Group();
  scene.add(trail);
  const trailMat = new T.MeshBasicMaterial({
    color: '#e9b563',
    transparent: true,
    opacity: 0.8,
  });
  for (let i = 0; i < 18; i++) {
    const dot = new T.Mesh(
      new T.CircleGeometry(0.055 + i * 0.002, 10),
      trailMat,
    );
    dot.rotation.x = -Math.PI / 2;
    trail.add(dot);
  }
  const path = new T.InstancedMesh(
    new T.BoxGeometry(0.24, 0.018, 0.055),
    new T.MeshBasicMaterial({
      color: '#d5ef78',
      transparent: true,
      opacity: 0.85,
    }),
    72,
  );
  scene.add(path);
  const dummy = new T.Object3D();
  const stop = box(
    scene,
    [0.07, 0.018, 2.8],
    [0, 0.025, 1.7],
    new T.MeshBasicMaterial({ color: '#ff887a' }),
    0,
  );
  let currentMode: CameraView | null = null,
    lastX = 0,
    lastZ = 0,
    recording = false,
    dead = false,
    openAmount = 0,
    revealAmount = 0,
    explodeAmount = 0,
    focusKey = '',
    focusing = 0;
  const cameraOffset = new T.Vector3();
  const target = new T.Vector3(),
    cameraGoal = new T.Vector3();
  const output = document.createElement('canvas');
  output.width = 1920;
  output.height = 1080;
  const out = output.getContext('2d')!;
  const hud = document.createElement('canvas');
  hud.setAttribute('aria-hidden', 'true');
  Object.assign(hud.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  });
  host.appendChild(hud);
  const hudContext = hud.getContext('2d')!;
  function resize() {
    if (dead) return;
    const w = recording ? 1920 : Math.max(1, host.clientWidth),
      h = recording ? 1080 : Math.max(1, host.clientHeight);
    renderer.setPixelRatio(
      recording ? 1 : Math.min(window.devicePixelRatio, 1.7),
    );
    renderer.setSize(w, h, false);
    hud.width = w;
    hud.height = h;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    focusKey = '';
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  function update(d: Display, delta = 0.016) {
    lastDisplay = d;
    const engineering = !!d.engineering,
      id = d.system ?? 'overview',
      assembly = d.assembly ?? 'cutaway';
    const f = engineering ? { ...d.frame, x: 0, z: 0 } : d.frame,
      inspect = engineering || d.camera === 'vehicle' || d.camera === 'cabin';
    world.visible = !inspect;
    plinth.visible = inspect;
    plinth.position.x = f.x;
    plinth.position.z = f.z;
    scene.background = new T.Color(d.night ? '#0b141d' : '#17252c');
    ambient.intensity = d.night ? 0.9 : 2;
    sun.intensity = d.night ? 0.7 : 3.6;
    renderer.toneMappingExposure = d.night ? 0.9 : 1.25;
    car.group.position.set(f.x, 0, f.z);
    car.group.visible = !(
      engineering &&
      id === 'control' &&
      d.controlDetail === 'electronics' &&
      assembly !== 'assembled'
    );
    const yaw = Math.atan2(
      laneAt(f.x + 0.1, d.settings.scenario) -
        laneAt(f.x - 0.1, d.settings.scenario),
      0.2,
    );
    car.group.rotation.y = engineering ? 0 : -yaw;
    hardware.group.position.set(f.x, 0, f.z);
    hardware.update(
      d.frame,
      d.settings,
      id,
      assembly,
      delta,
      d.tourPose,
      d.steering,
      d.controlDetail,
    );
    hardware.group.visible = engineering && assembly !== 'assembled';
    revealAmount =
      d.tourPose?.reveal ??
      T.MathUtils.damp(
        revealAmount,
        engineering && assembly !== 'assembled' ? 1 : 0,
        5,
        delta,
      );
    explodeAmount =
      d.tourPose?.explode ??
      T.MathUtils.damp(
        explodeAmount,
        engineering && assembly === 'exploded' ? 1 : 0,
        5,
        delta,
      );
    car.reveal(revealAmount, explodeAmount);
    openAmount =
      d.tourPose?.doors ??
      T.MathUtils.damp(openAmount, d.doors && inspect ? 1 : 0, 4, delta);
    car.update(
      d.steering ? 0 : d.frame.x + 17,
      d.steering?.measured ?? steeringAt(d.frame.x, d.settings.scenario),
      openAmount,
    );
    car.brake(f.acceleration < -0.3 || (f.yielding && f.speed < 0.2));
    van.visible = d.settings.scenario === 'crossing';
    pedestrian.visible = van.visible;
    roadworks.visible = d.settings.scenario === 'roadworks';
    trafficLight.visible = d.settings.scenario === 'signal';
    pedestrian.position.set(5, 0, f.pedestrianZ);
    person.update(f.time, d.settings.pedestrianDelay);
    lights.forEach((m, i) => {
      const lit = i === (f.signal === 'red' ? 0 : 2);
      m.emissiveIntensity = lit ? 4 : 0;
      m.color.set(lit ? ['#ff5547', '#e6b764', '#83e3a3'][i] : '#273334');
    });
    detection.visible = !inspect && d.view !== 'street' && f.visible;
    detection.box.min.set(4.68, 0, f.pedestrianZ - 0.3);
    detection.box.max.set(5.32, 1.74, f.pedestrianZ + 0.3);
    rays.visible = !inspect && d.view === 'vision';
    if (rays.visible) {
      const pos = rayGeometry.attributes.position as T.BufferAttribute;
      for (let i = 0; i < 32; i++) {
        const a = (i / 31 - 0.5) * 2.35 + yaw;
        let distance = 20;
        const ax = f.x + 1.9,
          az = f.z;
        if (van.visible)
          for (let r = 0.2; r < 20; r += 0.2)
            if (
              blockedByVan(ax, az, ax + Math.cos(a) * r, az + Math.sin(a) * r)
            ) {
              distance = r;
              break;
            }
        pos.setXYZ(i * 2, ax, 0.73, az);
        pos.setXYZ(
          i * 2 + 1,
          ax + Math.cos(a) * distance,
          0.045,
          az + Math.sin(a) * distance,
        );
      }
      pos.needsUpdate = true;
      rayGeometry.computeBoundingSphere();
    }
    trail.visible =
      !inspect &&
      (d.view === 'prediction' || d.view === 'planning') &&
      f.visible &&
      f.pedestrianZ < 4.2;
    trail.children.forEach((o, i) =>
      o.position.set(5, 0.04, f.pedestrianZ + (i + 1) * 0.16),
    );
    path.visible =
      !inspect && (d.view === 'planning' || d.view === 'prediction');
    const end = f.yielding
      ? d.settings.scenario === 'signal'
        ? 2
        : 3.4
      : f.x + 21;
    for (let i = 0; i < 72; i++) {
      const x = f.x + 2.25 + i * 0.25;
      dummy.position.set(x, 0.04, laneAt(x, d.settings.scenario));
      dummy.rotation.y = -Math.atan2(
        laneAt(x + 0.1, d.settings.scenario) -
          laneAt(x - 0.1, d.settings.scenario),
        0.2,
      );
      dummy.scale.setScalar(x < end ? 1 : 0);
      dummy.updateMatrix();
      path.setMatrixAt(i, dummy.matrix);
    }
    path.instanceMatrix.needsUpdate = true;
    path.computeBoundingSphere();
    stop.visible = !inspect && d.view === 'planning' && f.yielding;
    stop.position.x = d.settings.scenario === 'signal' ? 2 : 3.4;
    if (!d.tourPose) {
      target.set(f.x + (inspect ? 0 : 3), inspect ? 0.7 : 0.55, f.z);
      const nextFocus = engineering
        ? id + '-' + assembly + '-' + d.controlDetail
        : d.camera === 'cabin'
          ? 'cabin'
          : 'road';
      if (d.camera === 'cabin' && !engineering)
        target.set(f.x - 0.22, 0.84, f.z - 0.08);
      if (focusKey !== nextFocus) {
        focusKey = nextFocus;
        focusing = 1.2;
        currentMode = null;
      }
      if (currentMode !== d.camera) {
        currentMode = d.camera;
        camera.fov = d.camera === 'cabin' && !engineering ? 60 : 42;
        camera.updateProjectionMatrix();
        if (d.camera === 'cabin' && !engineering)
          cameraGoal.set(f.x + 0.18, 1.19, f.z + 1.52);
        else if (inspect) cameraGoal.set(f.x + 5.6, 3.4, f.z + 6.2);
        else if (d.camera === 'overhead')
          cameraGoal.set(f.x + 1, 22, f.z + 0.1);
        else if (d.camera === 'bumper') cameraGoal.set(f.x + 1.62, 1.08, f.z);
        else cameraGoal.set(f.x + 11, 8.5, f.z + 14);
        if (!engineering) {
          camera.position.copy(cameraGoal);
          controls.target.copy(target);
        }
      } else if (!inspect && d.camera !== 'bumper') {
        const dx = f.x - lastX,
          dz = f.z - lastZ;
        camera.position.x += dx;
        camera.position.z += dz;
        controls.target.x += dx;
        controls.target.z += dz;
      }
      if (d.camera === 'bumper' && !engineering) {
        camera.position.set(f.x + 1.62, 1.08, f.z);
        controls.target.set(f.x + 16, 1.08, f.z);
        controls.enabled = false;
      } else {
        controls.enabled = true;
      }
      if (engineering) {
        const wide =
          id === 'overview' || id === 'power' || assembly === 'assembled';
        target.copy(
          wide
            ? new T.Vector3(0, assembly === 'exploded' ? 0.85 : 0.6, 0)
            : hardware.anchor(id, d.controlDetail),
        );
        const baseDistance = wide
          ? assembly === 'exploded'
            ? 7.5
            : 6.8
          : id === 'compute'
            ? 2.25
            : id === 'control'
              ? d.controlDetail === 'electronics'
                ? 2.65
                : 3.1
              : 4.4;
        const r =
          baseDistance * Math.max(1, Math.min(1.7, 1.15 / camera.aspect));
        const a =
          id === 'control'
            ? d.controlDetail === 'electronics'
              ? 1.28
              : 2.12
            : 0.74;
        cameraOffset.set(Math.cos(a) * r, r * 0.55, Math.sin(a) * r);
        if (focusing > 0) {
          cameraGoal.copy(target).add(cameraOffset);
          camera.position.lerp(cameraGoal, Math.min(1, delta * 5));
          controls.target.lerp(target, Math.min(1, delta * 5));
          focusing -= delta;
        }
        controls.minDistance = id === 'compute' ? 1 : 2;
        controls.maxDistance = 16;
      } else {
        controls.minDistance = d.camera === 'cabin' ? 0.35 : 3.8;
        controls.maxDistance = d.camera === 'cabin' ? 5 : 40;
      }
      controls.update();
    } else {
      // Every shot is a pure sample of tour time, including seeks and the first export frame.
      const p = d.tourPose;
      controls.enabled = false;
      target.set(...p.target);
      if (p.anchor === 'system')
        target.add(hardware.anchor(id, d.controlDetail));
      else target.add(new T.Vector3(f.x, 0, f.z));
      const r = p.distance * Math.max(1, Math.min(1.7, 1.15 / camera.aspect));
      camera.position
        .copy(target)
        .add(
          new T.Vector3(
            Math.cos(p.yaw) * Math.cos(p.elevation) * r,
            Math.sin(p.elevation) * r,
            Math.sin(p.yaw) * Math.cos(p.elevation) * r,
          ),
        );
      camera.fov = p.fov;
      camera.updateProjectionMatrix();
      camera.lookAt(target);
      controls.target.copy(target);
      currentMode = null;
      focusKey = '';
    }
    lastX = f.x;
    lastZ = f.z;
    sun.target.position.set(f.x, 0, 0);
    sun.position.set(f.x - 12, 25, 16);
    renderer.render(scene, camera);
    hudContext.clearRect(0, 0, hud.width, hud.height);
    if (d.steering)
      drawSteeringReadout(
        hudContext,
        d.steering,
        hud.width,
        hud.height,
        d.controlDetail,
        d.frame.time,
      );
    if (recording) {
      out.fillStyle = '#10191f';
      out.fillRect(0, 0, 1920, 1080);
      out.drawImage(renderer.domElement, 0, 0, 1920, 1080);
      drawRecordingBrand(out);
      if (d.steering)
        drawSteeringReadout(
          out,
          d.steering,
          1920,
          1080,
          d.controlDetail,
          d.frame.time,
        );
      out.save();
      out.fillStyle = '#d5ef78';
      out.font = '500 19px Arial';
      out.textAlign = 'right';
      out.fillText('howthingsclick.com/self-driving', 1875, 1040);
      out.restore();
    }
  }
  return {
    ready: detailReady,
    update,
    resetCamera() {
      currentMode = null;
      focusKey = '';
    },
    startCapture(firstFrame: Display) {
      recording = true;
      resize();
      update(firstFrame, 0);
      return output.captureStream(30);
    },
    endCapture() {
      recording = false;
      resize();
    },
    dispose() {
      dead = true;
      observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown', pointerDown);
      renderer.domElement.removeEventListener('pointerup', pointerUp);
      controls.dispose();
      person.dispose();
      const geometries = new Set<T.BufferGeometry>(),
        materials = new Set<T.Material>();
      scene.traverse((o) => {
        if (
          o instanceof T.Mesh ||
          o instanceof T.Line ||
          o instanceof T.Sprite
        ) {
          geometries.add(o.geometry);
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            materials.add(m),
          );
        }
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => {
        const map = (m as T.MeshStandardMaterial).map;
        if (map) map.dispose();
        m.dispose();
      });
      env.dispose();
      noise.dispose();
      sun.shadow.map?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      hud.remove();
    },
  };
}
export type DrivingScene = ReturnType<typeof createDrivingScene>;
