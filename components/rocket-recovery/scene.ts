import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { createEarth, createStarbase } from './environment';
import { drawRecordingBrand } from '@/lib/brand';
import {
  clamp,
  smooth,
  mix,
  specs,
  simulate,
  sampleFlight,
  sampleShort,
  defaultSettings,
  type Vehicle,
  type View,
  type Frame,
} from '@/lib/rocket-recovery/simulation';
import { createRocket, poseRocket, createShip, createTower } from './model';
export type Display = {
  vehicle: Vehicle;
  view: View;
  frame: Frame;
  time: number;
  explode: number;
  fin: number;
  deploy: number;
  armOpen: number;
  labels: boolean;
  guided: boolean;
  shot?: string;
  local?: number;
};
const referenceFlights = {
  falcon9: simulate({ ...defaultSettings, vehicle: 'falcon9' }),
  superheavy: simulate({ ...defaultSettings, vehicle: 'superheavy' }),
};
const lateFlight = simulate({
  ...defaultSettings,
  vehicle: 'falcon9',
  automatic: false,
  ignitionHeight: 40,
});
export function tourDisplay(time: number): Display {
  const { shot, local } = sampleShort(time),
    flight = referenceFlights[shot.vehicle];
  let ft = flight.contactTime + 1;
  if (shot.id === 'hook') ft = flight.contactTime - 2.1 + local * 4.5;
  if (shot.id === 'fall') ft = mix(0.3, flight.contactTime * 0.62, local);
  if (shot.id === 'catch') ft = flight.contactTime - 3.7 + local * 5.7;
  if (shot.id === 'legs') ft = flight.contactTime - 2.8 + local * 4.5;
  const frame = sampleFlight(
    shot.id === 'challenge' ? lateFlight : flight,
    shot.id === 'challenge' ? local * lateFlight.duration : ft,
  );
  const geography = shot.id === 'fall' && local < 0.29;
  if (shot.view === 'fins' || shot.view === 'engines') {
    frame.altitude = 0;
    frame.x = 0;
    frame.outcome = 'descending';
    frame.fin = Math.sin(local * Math.PI * 3) * 0.38;
    frame.gimbal = Math.sin(local * Math.PI * 2) * 0.11;
    frame.throttle = shot.view === 'engines' ? 0.66 : 0;
  }
  return {
    vehicle: shot.vehicle,
    view: geography ? 'earth' : shot.view,
    frame,
    time,
    explode: 0,
    fin: frame.fin,
    deploy: shot.id === 'legs' ? smooth(local * 1.8) : 1,
    armOpen: shot.id === 'catch' ? 1 - smooth(local * 2) : 0,
    labels: false,
    guided: true,
    shot: shot.id,
    local,
  };
}
export function createRecoveryScene(
  host: HTMLElement,
  onPick: (part: string) => void,
) {
  const renderer = new T.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true,
  });
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.domElement.setAttribute(
    'aria-label',
    'Interactive rocket recovery model. Drag to orbit and scroll to zoom.',
  );
  host.appendChild(renderer.domElement);
  const overlay = document.createElement('canvas');
  overlay.className = 'rr-overlay';
  host.appendChild(overlay);
  const ctx = overlay.getContext('2d')!;
  const scene = new T.Scene(),
    groundFog = new T.FogExp2('#b1bdc4', 0.0003);
  scene.fog = groundFog;
  let assetsResolve!: () => void;
  const ready = new Promise<void>((resolve) => {
    assetsResolve = resolve;
  });
  const manager = new T.LoadingManager(() => assetsResolve());
  const assetErrors: string[] = [];
  manager.onError = (url) => assetErrors.push(url);
  const loader = new T.TextureLoader(manager);
  const camera = new T.PerspectiveCamera(36, 1, 0.15, 6500);
  camera.position.set(150, 95, 180);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 8;
  controls.maxDistance = 800;
  controls.maxPolarAngle = Math.PI * 0.92;
  const sunDirection = new T.Vector3(-0.65, 0.58, 0.48).normalize();
  const sky = new Sky();
  sky.scale.setScalar(4500);
  sky.material.uniforms.turbidity.value = 3;
  sky.material.uniforms.rayleigh.value = 1.6;
  sky.material.uniforms.mieCoefficient.value = 0.003;
  sky.material.uniforms.mieDirectionalG.value = 0.78;
  sky.material.uniforms.sunPosition.value.copy(sunDirection);
  scene.add(sky);
  const pmrem = new T.PMREMGenerator(renderer),
    environmentScene = new T.Scene();
  environmentScene.add(sky.clone());
  const env = pmrem.fromScene(environmentScene, 0.04);
  scene.environment = env.texture;
  scene.environmentIntensity = 0.7;
  pmrem.dispose();
  const sun = new T.DirectionalLight('#fff1dc', 2.8);
  sun.position.copy(sunDirection).multiplyScalar(330);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -150,
    right: 150,
    top: 175,
    bottom: -150,
    near: 1,
    far: 800,
  });
  sun.shadow.normalBias = 0.09;
  sun.shadow.bias = -0.00003;
  const ambient = new T.HemisphereLight('#d2e5f2', '#646956', 0.95);
  scene.add(sun, sun.target, ambient);
  const rim = new T.DirectionalLight('#bfd8ed', 0.45);
  rim.position.set(120, 120, -130);
  scene.add(rim);
  const waterMat = new T.ShaderMaterial({
    uniforms: { time: { value: 0 }, sunDirection: { value: sunDirection } },
    vertexShader:
      'varying vec3 vPos;void main(){vPos=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `
 varying vec3 vPos;uniform float time;uniform vec3 sunDirection;
 float wave(vec2 p){return sin(p.x*.55+sin(p.y*.29)*1.5+time*.7)*.24+sin(dot(p,vec2(.17,.39))-time*.6)*.32+sin(dot(p,vec2(.8,-.23))+time*.44)*.075;}
 void main(){vec2 p=vPos.xz;float h=wave(p);vec3 n=normalize(vec3(h-wave(p+vec2(.6,0.)),1.7,h-wave(p+vec2(0.,.6))));vec3 v=normalize(cameraPosition-vPos);float f=pow(1.-max(dot(n,v),0.),4.);float spec=pow(max(dot(n,normalize(v+sunDirection)),0.),180.);vec3 c=mix(vec3(.016,.054,.071),vec3(.39,.49,.55),f*.85);c+=vec3(.94,.77,.5)*spec*.7;float fog=1.-exp(-length(cameraPosition-vPos)*.00027);c=mix(c,vec3(.43,.51,.57),fog*.75);gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`,
  });
  const ocean = new T.Mesh(new T.PlaneGeometry(9000, 9000), waterMat);
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = -3;
  scene.add(ocean);
  // The coast and drone ship share a sea horizon, with only the selected recovery site visible.
  const coast = createStarbase(loader);
  scene.add(coast);
  const earth = createEarth(loader);
  scene.add(earth.root);
  const tower = createTower();
  coast.add(tower.root);
  const ship = createShip();
  scene.add(ship);
  const rockets = {
    falcon9: createRocket('falcon9'),
    superheavy: createRocket('superheavy'),
  };
  scene.add(rockets.falcon9.root, rockets.superheavy.root);
  // Transparent plume haze and radial dust are decorative and do not drive the physics model.
  const hazeGeometry = new T.BufferGeometry(),
    hazePositions = new Float32Array(160 * 3);
  hazeGeometry.setAttribute(
    'position',
    new T.BufferAttribute(hazePositions, 3),
  );
  const smokeCanvas = document.createElement('canvas');
  smokeCanvas.width = 64;
  smokeCanvas.height = 64;
  const sc = smokeCanvas.getContext('2d')!,
    grad = sc.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(236,228,213,.4)');
  grad.addColorStop(0.5, 'rgba(225,224,217,.2)');
  grad.addColorStop(1, 'rgba(225,224,217,0)');
  sc.fillStyle = grad;
  sc.fillRect(0, 0, 64, 64);
  const smokeTexture = new T.CanvasTexture(smokeCanvas),
    hazeMat = new T.PointsMaterial({
      size: 12,
      map: smokeTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
      color: '#d7d3c9',
    });
  const haze = new T.Points(hazeGeometry, hazeMat);
  scene.add(haze);
  const pathGeo = new T.BufferGeometry().setFromPoints([
      new T.Vector3(0, 0, 0),
      new T.Vector3(0, 300, 0),
    ]),
    path = new T.Line(
      pathGeo,
      new T.LineDashedMaterial({
        color: '#aeeaf3',
        dashSize: 1,
        gapSize: 2,
        transparent: true,
        opacity: 0.45,
      }),
    );
  path.computeLineDistances();
  scene.add(path);

  let captureTrack: CanvasCaptureMediaStreamTrack | undefined;
  let width = 1,
    height = 1,
    capturing = false,
    lastView = '',
    lastVehicle = '',
    lastShot = '',
    userOrbit = false,
    lastDisplay: Display | undefined,
    disposed = false,
    contextLost = false;
  const previousTarget = new T.Vector3();
  const resize = () => {
    if (capturing || disposed) return;
    width = Math.max(1, host.clientWidth);
    height = Math.max(1, host.clientHeight);
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    overlay.width = Math.round(width * devicePixelRatio);
    overlay.height = Math.round(height * devicePixelRatio);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();
  let captureCanvas = document.createElement('canvas');
  captureCanvas.width = 1080;
  captureCanvas.height = 1920;
  let captureContext = captureCanvas.getContext('2d', { alpha: false })!;
  const raycaster = new T.Raycaster(),
    pointer = new T.Vector2();
  let down = { x: 0, y: 0 };
  const orbitStart = () => {
    userOrbit = true;
  };
  controls.addEventListener('start', orbitStart);
  const pointerDown = (e: PointerEvent) => {
    down = { x: e.clientX, y: e.clientY };
  };
  const pointerUp = (e: PointerEvent) => {
    if (
      Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5 ||
      !lastDisplay ||
      lastDisplay.view === 'earth'
    )
      return;
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((e.clientX - bounds.left) / bounds.width) * 2 - 1,
      (-(e.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(
      [
        rockets[lastDisplay.vehicle].root,
        ...(lastDisplay.vehicle === 'superheavy' ? [tower.root] : []),
      ],
      true,
    );
    let selected = hits.find(
      (h) =>
        (h.object as T.Mesh).material !==
        rockets[lastDisplay!.vehicle].flameMat,
    )?.object;
    while (selected && !selected.userData.part)
      selected = selected.parent ?? undefined;
    if (selected) onPick(selected.userData.part);
  };
  renderer.domElement.addEventListener('pointerdown', pointerDown);
  renderer.domElement.addEventListener('pointerup', pointerUp);
  const lost = (event: Event) => {
    event.preventDefault();
    contextLost = true;
    onPick('Graphics interrupted. Reload this page to restore the 3D view.');
  };
  renderer.domElement.addEventListener('webglcontextlost', lost);
  function cameraPreset(d: Display) {
    const r = rockets[d.vehicle],
      base = r.root.position,
      heavy = d.vehicle === 'superheavy';
    const target = new T.Vector3(
        heavy ? -13 : base.x,
        heavy ? Math.max(72, base.y + r.h * 0.42) : base.y + r.h * 0.45,
        0,
      ),
      offset = new T.Vector3(
        heavy ? 174 : 68,
        heavy ? 112 : 36,
        heavy ? 215 : 92,
      );
    if (d.view === 'earth') {
      const target = new T.Vector3(0, 0, 0),
        position = new T.Vector3(-12, 100, 235);
      if (d.guided) position.multiplyScalar(1.05 - (d.local ?? 0) * 0.12);
      return { target, position };
    }
    if (d.view === 'fins') {
      target.set(0, base.y + (heavy ? 66 : 36), 0);
      offset.set(heavy ? 18 : 8, heavy ? 13 : 6, heavy ? 23 : 12);
    }
    if (d.view === 'engines') {
      target.set(0, base.y - 2, 0);
      offset.set(heavy ? 17 : 9, heavy ? -8 : -5, heavy ? 21 : 13);
    }
    if (d.view === 'hardware') {
      target.set(0, base.y + (heavy ? 60 : 5), 0);
      offset.set(heavy ? 27 : 24, heavy ? 17 : 20, heavy ? 38 : 32);
    }
    if (d.shot === 'catch') {
      const push = smooth(((d.local ?? 0) - 0.52) / 0.48);
      target.y = base.y + mix(60, 64, push);
      offset.multiplyScalar(mix(1, 0.73, push));
    }
    if (d.shot === 'hook') {
      const pull = smooth((d.local ?? 0) * 1.5);
      target.set(mix(0, -5, pull), base.y + mix(62, 43, pull), 0);
      offset.set(mix(29, 66, pull), mix(12, 30, pull), mix(39, 88, pull));
    }
    if (d.shot === 'explore') {
      target.set(-9, 72, 0);
      offset.set(190, 120, 210);
    }
    if (d.guided) {
      const angle = ((d.local ?? 0) - 0.5) * 0.25;
      offset.applyAxisAngle(new T.Vector3(0, 1, 0), angle);
    }
    // Portrait preserves vertical subject scale; landscape gets room for the tower.
    if (camera.aspect < 0.8)
      offset.multiplyScalar(
        d.view === 'recovery'
          ? 1.08
          : d.view === 'hardware' && !heavy
            ? 1.34
            : 1.18,
      );
    return { target, position: target.clone().add(offset) };
  }
  function textLabel(text: string, point: T.Vector3, side = 1) {
    const p = point.clone().project(camera);
    if (p.z > 1 || p.z < -1) return;
    const x = (p.x * 0.5 + 0.5) * width,
      y = (-p.y * 0.5 + 0.5) * height;
    if (x < 0 || x > width || y < 0 || y > height) return;
    ctx.font = '500 12px Arial';
    const tw = ctx.measureText(text).width;
    const bx = clamp(x + side * 28, 12, Math.max(12, width - tw - 30)),
      by = clamp(y - 30, 45, height - 25);
    ctx.strokeStyle = '#bef5f7';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(bx, by + 10);
    ctx.stroke();
    ctx.fillStyle = 'rgba(9,25,36,.9)';
    ctx.fillRect(bx - 7, by - 2, tw + 14, 24);
    ctx.fillStyle = '#f0fbff';
    ctx.fillText(text, bx, by + 14);
  }
  function drawOverlay(d: Display) {
    ctx.setTransform(
      overlay.width / width,
      0,
      0,
      overlay.height / height,
      0,
      0,
    );
    ctx.clearRect(0, 0, width, height);
    if (!d.labels || capturing) return;
    if (d.view === 'earth') {
      textLabel('Starbase · Texas', earth.starbase, -1);
      textLabel('Atlantic drone-ship zone (example)', earth.atlantic, 1);
      return;
    }
    const r = rockets[d.vehicle],
      p = r.root.position;
    if (d.view === 'recovery' || d.view === 'fins')
      textLabel(
        'Grid fins',
        new T.Vector3(
          p.x + r.r,
          p.y + (d.vehicle === 'superheavy' ? 66 : 36),
          0,
        ),
      );
    if (d.view === 'recovery' || d.view === 'engines')
      textLabel('Gimballed engines', new T.Vector3(p.x, p.y + 1, 0));
    if (d.view === 'hardware')
      textLabel(
        d.vehicle === 'superheavy'
          ? 'Catch interface'
          : 'Deployable landing legs',
        new T.Vector3(p.x, p.y + (d.vehicle === 'superheavy' ? 64 : 4), r.r),
        -1,
      );
  }
  function update(d: Display, dt = 1 / 60) {
    if (disposed || contextLost) return;
    lastDisplay = d;
    const heavy = d.vehicle === 'superheavy',
      r = rockets[d.vehicle],
      f = d.frame,
      cfg = specs[d.vehicle],
      space = d.view === 'earth';
    earth.root.visible = space;
    sky.visible = !space;
    ocean.visible = !space;
    scene.fog = space ? null : groundFog;
    scene.background = space ? new T.Color('#03080f') : null;
    scene.environmentIntensity = space ? 0.08 : 0.7;
    ambient.intensity = space ? 0.06 : 0.95;
    rim.intensity = space ? 0.05 : 0.45;
    earth.clouds.rotation.y = d.time * 0.0006;
    rockets.falcon9.root.visible = !heavy && !space;
    rockets.superheavy.root.visible = heavy && !space;
    coast.visible = heavy && (d.view === 'recovery' || d.view === 'hardware');
    ship.visible = !heavy && (d.view === 'recovery' || d.view === 'hardware');
    const focus =
      d.view === 'fins' ||
      d.view === 'engines' ||
      (d.view === 'hardware' && !d.guided);
    r.root.position.set(
      focus ? 0 : f.x,
      focus ? cfg.contactHeight : cfg.contactHeight + f.altitude,
      0,
    );
    r.root.rotation.z = focus ? 0 : -f.gimbal * 0.7;
    if (f.outcome === 'hard-contact' || f.outcome === 'missed') {
      r.root.rotation.z = -0.05 * smooth(Math.max(0, d.time - f.t));
    }
    const deploy =
      d.view === 'hardware'
        ? d.deploy
        : focus
          ? 0
          : smooth(1 - f.altitude / 80);
    const power =
      (d.view === 'hardware' && !d.guided) ||
      space ||
      (d.view === 'engines' && d.explode > 0.001)
        ? 0
        : f.throttle;
    poseRocket(
      r,
      heavy ? 1 : deploy,
      d.fin,
      focus && d.view !== 'engines' ? 0 : f.gimbal,
      power,
      d.time,
      d.view === 'engines' ? d.explode : 0,
    );
    tower.arms.forEach((a, i) => {
      const sign = i === 0 ? -1 : 1;
      a.rotation.y = sign * d.armOpen * 0.055;
    });
    waterMat.uniforms.time.value = d.time;
    ship.rotation.x = Math.sin(d.time * 0.34) * 0.0015;
    ship.rotation.z = Math.sin(d.time * 0.28) * 0.001;
    haze.visible = power > 0 && !focus && !space && f.altitude < 80;
    hazeMat.opacity = clamp((80 - f.altitude) / 80) * 0.65;
    for (let i = 0; i < 160; i++) {
      const phase = (i / 160 + d.time * 0.19) % 1,
        a = i * 2.3999632;
      hazePositions[i * 3] = Math.cos(a) * phase * 45 + f.x;
      hazePositions[i * 3 + 1] = 1 + phase * 7;
      hazePositions[i * 3 + 2] = Math.sin(a) * phase * 45;
    }
    hazeGeometry.attributes.position.needsUpdate = true;
    path.visible = d.labels && !d.guided && d.view === 'recovery';
    path.position.set(0, cfg.contactHeight, 0);
    const changed =
      lastView !== d.view ||
      lastVehicle !== d.vehicle ||
      lastShot !== (d.shot ?? '');
    if (changed) userOrbit = false;
    const preset = cameraPreset(d);
    if (!userOrbit || d.guided) {
      const factor =
        changed || dt === 0 || d.guided ? 1 : 1 - Math.exp(-dt * 5);
      camera.position.lerp(preset.position, factor);
      controls.target.lerp(preset.target, factor);
    } else if (d.view === 'recovery') {
      const delta = preset.target.clone().sub(previousTarget);
      camera.position.add(delta);
      controls.target.add(delta);
    }
    previousTarget.copy(preset.target);
    lastView = d.view;
    lastVehicle = d.vehicle;
    lastShot = d.shot ?? '';
    controls.enabled = !d.guided && !capturing;
    controls.update();
    sun.target.position.copy(space ? new T.Vector3() : r.root.position);
    sun.position
      .copy(sun.target.position)
      .add(sunDirection.clone().multiplyScalar(330));
    renderer.render(scene, camera);
    drawOverlay(d);
    if (capturing) {
      captureContext.drawImage(renderer.domElement, 0, 0, 1080, 1920);
      const shade = captureContext.createLinearGradient(0, 0, 0, 220);
      shade.addColorStop(0, 'rgba(4,13,23,.75)');
      shade.addColorStop(1, 'rgba(4,13,23,0)');
      captureContext.fillStyle = shade;
      captureContext.fillRect(0, 0, 1080, 220);
      captureContext.save();
      captureContext.translate(45, 70);
      captureContext.scale(1.65, 1.65);
      drawRecordingBrand(captureContext);
      captureContext.restore();
      if (d.shot === 'explore') {
        captureContext.fillStyle = 'rgba(5,16,27,.8)';
        captureContext.fillRect(65, 1410, 950, 165);
        captureContext.fillStyle = '#e3f28b';
        captureContext.font = '700 47px Arial';
        captureContext.textAlign = 'center';
        captureContext.fillText('YOUR TURN TO LAND IT', 540, 1475);
        captureContext.fillStyle = '#f3f8fc';
        captureContext.font = '35px Arial';
        captureContext.fillText(
          'howthingsclick.com/rocket-recovery',
          540,
          1530,
        );
      }
      captureTrack?.requestFrame();
    }
  }
  function startPreview(d: Display) {
    captureTrack = undefined;
    captureCanvas.remove();
    captureCanvas = document.createElement('canvas');
    captureCanvas.width = 1080;
    captureCanvas.height = 1920;
    captureCanvas.className = 'rr-capture-preview';
    captureContext = captureCanvas.getContext('2d', { alpha: false })!;
    host.appendChild(captureCanvas);
    capturing = true;
    renderer.setPixelRatio(1);
    renderer.setSize(1080, 1920, false);
    camera.aspect = 1080 / 1920;
    camera.updateProjectionMatrix();
    update(d, 0);
  }
  function startCapture(d: Display) {
    startPreview(d);
    const stream = captureCanvas.captureStream(0);
    captureTrack = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack;
    update(d, 0);
    return stream;
  }
  function endCapture() {
    captureCanvas.remove();
    captureTrack = undefined;
    capturing = false;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    resize();
    userOrbit = false;
    if (lastDisplay) update(lastDisplay, 0);
  }
  function resetCamera() {
    userOrbit = false;
    if (lastDisplay) update(lastDisplay, 0);
  }
  function snapshot() {
    return renderer.domElement.toDataURL('image/png');
  }
  function dispose() {
    disposed = true;
    ro.disconnect();
    controls.removeEventListener('start', orbitStart);
    controls.dispose();
    renderer.domElement.removeEventListener('pointerdown', pointerDown);
    renderer.domElement.removeEventListener('pointerup', pointerUp);
    renderer.domElement.removeEventListener('webglcontextlost', lost);
    const geometries = new Set<T.BufferGeometry>(),
      mats = new Set<T.Material>(),
      textures = new Set<T.Texture>([env.texture, smokeTexture]);
    scene.traverse((o) => {
      if (o instanceof T.Mesh || o instanceof T.Points || o instanceof T.Line) {
        geometries.add(o.geometry);
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          mats.add(m);
      }
    });
    for (const m of mats) {
      for (const value of Object.values(m))
        if (value instanceof T.Texture) textures.add(value);
      m.dispose();
    }
    geometries.forEach((g) => g.dispose());
    textures.forEach((t) => t.dispose());
    env.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    overlay.remove();
    captureCanvas.remove();
  }
  return {
    ready,
    assetErrors,
    update,
    startPreview,
    startCapture,
    endCapture,
    frameCanvas: () => captureCanvas,
    resetCamera,
    snapshot,
    dispose,
  };
}
