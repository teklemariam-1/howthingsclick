import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { drawRecordingBrand } from '@/lib/brand';
import { handoffAt, type View } from '@/lib/starlink/simulation';
export type Display = {
  view: View;
  time: number;
  angle: number;
  explode: number;
  blocked: boolean;
  lasers: boolean;
  guided: boolean;
  title?: string;
  kicker?: string;
  progress?: number;
  shotId?: string;
  portrait?: boolean;
  localTime?: number;
};
export function createStarlinkScene(
  host: HTMLElement,
  onSelect: (v: View) => void,
) {
  const renderer = new T.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true,
  });
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute(
    'aria-label',
    'Interactive Starlink 3D model',
  );
  const overlay = document.createElement('canvas');
  overlay.className = 'sl-overlay';
  host.appendChild(overlay);
  const ctx = overlay.getContext('2d')!;
  const scene = new T.Scene();
  scene.background = new T.Color('#030914');
  const camera = new T.PerspectiveCamera(40, 1, 0.05, 400);
  camera.position.set(12, 9, 24);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.085;
  controls.minDistance = 3;
  controls.maxDistance = 60;
  controls.enablePan = false;
  const pmrem = new T.PMREMGenerator(renderer),
    room = new RoomEnvironment(),
    env = pmrem.fromScene(room, 0.04);
  scene.environment = env.texture;
  scene.environmentIntensity = 0.7;
  pmrem.dispose();
  room.dispose();
  const sun = new T.DirectionalLight('#fff1da', 4.4);
  sun.position.set(-12, 16, 15);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -18,
    right: 18,
    top: 18,
    bottom: -18,
  });
  sun.shadow.bias = -0.0002;
  scene.add(sun);
  const rim = new T.DirectionalLight('#78bdff', 2);
  rim.position.set(10, 3, -12);
  scene.add(rim, new T.HemisphereLight('#a3cce4', '#142434', 1.3));
  const hero = new T.Group(),
    network = new T.Group(),
    terminal = new T.Group(),
    gateway = new T.Group();
  scene.add(hero, network, terminal, gateway);
  const satellite = new T.Group(),
    dish = new T.Group();
  hero.add(satellite);
  terminal.add(dish);
  dish.scale.setScalar(12);
  dish.rotation.x = 0.45;
  dish.position.y = 0.2;
  const parts = new Map<string, T.Object3D>(),
    pickables: T.Object3D[] = [];
  const loader = new T.TextureLoader();
  const textures: T.Texture[] = [];
  const texturePromises: Promise<T.Texture>[] = [];
  function texture(name: string, color = true) {
    const p = loader.loadAsync('/textures/starlink/' + name).then((t) => {
      t.colorSpace = color ? T.SRGBColorSpace : T.NoColorSpace;
      t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      textures.push(t);
      return t;
    });
    texturePromises.push(p);
    return p;
  }
  const dayP = texture('earth-day.jpg'),
    nightP = texture('earth-night.jpg'),
    cloudP = texture('earth-clouds.jpg', false);
  const earthMat = new T.ShaderMaterial({
    uniforms: {
      day: { value: null },
      night: { value: null },
      sun: { value: new T.Vector3(-0.6, 0.5, 1).normalize() },
    },
    vertexShader:
      'varying vec2 uvv;varying vec3 nn;void main(){uvv=uv;nn=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:
      'uniform sampler2D day;uniform sampler2D night;uniform vec3 sun;varying vec2 uvv;varying vec3 nn;void main(){float d=dot(normalize(nn),sun);vec3 c=texture2D(day,uvv).rgb*(.065+1.05*max(d,0.));c+=texture2D(night,uvv).rgb*(1.-smoothstep(-.18,.12,d))*.8;gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',
  });
  const cloudMat = new T.MeshPhongMaterial({
    color: '#eef7ff',
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
    shininess: 4,
  });
  function earth(parent: T.Object3D, r: number, pos: T.Vector3) {
    const g = new T.Group();
    g.position.copy(pos);
    parent.add(g);
    const globe = new T.Mesh(new T.SphereGeometry(r, 128, 72), earthMat);
    globe.rotation.y = 2.2;
    g.add(globe);
    const clouds = new T.Mesh(
      new T.SphereGeometry(r * 1.0035, 96, 64),
      cloudMat,
    );
    clouds.rotation.y = 2.2;
    g.add(clouds);
    g.add(
      new T.Mesh(
        new T.SphereGeometry(r * 1.02, 96, 64),
        new T.ShaderMaterial({
          transparent: true,
          side: T.BackSide,
          depthWrite: false,
          blending: T.AdditiveBlending,
          vertexShader:
            'varying vec3 nn;varying vec3 vv;void main(){vec4 p=modelViewMatrix*vec4(position,1.);nn=normalize(normalMatrix*normal);vv=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',
          fragmentShader:
            'varying vec3 nn;varying vec3 vv;void main(){float f=pow(1.-abs(dot(normalize(nn),normalize(vv))),3.5);gl_FragColor=vec4(.08,.4,1.,f*.65);}',
        }),
      ),
    );
    return { g, clouds };
  }
  const planet = earth(hero, 26, new T.Vector3(0, -34, -34)),
    globe = earth(network, 5, new T.Vector3());
  const textureReady = Promise.all([dayP, nightP, cloudP]).then(([d, n, c]) => {
    earthMat.uniforms.day.value = d;
    earthMat.uniforms.night.value = n;
    cloudMat.alphaMap = c;
    cloudMat.needsUpdate = true;
  });
  let seed = 23;
  function rand() {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  }
  const starPositions = [];
  for (let i = 0; i < 1800; i++) {
    const p = new T.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5)
      .normalize()
      .multiplyScalar(85 + rand() * 50);
    starPositions.push(p.x, p.y, p.z);
  }
  const starGeo = new T.BufferGeometry();
  starGeo.setAttribute(
    'position',
    new T.Float32BufferAttribute(starPositions, 3),
  );
  const stars = new T.Points(
    starGeo,
    new T.PointsMaterial({
      color: '#bed4e4',
      size: 0.072,
      transparent: true,
      opacity: 0.58,
    }),
  );
  scene.add(stars);
  const metal = new T.MeshStandardMaterial({
      color: '#b5c3d0',
      metalness: 0.82,
      roughness: 0.27,
    }),
    dark = new T.MeshStandardMaterial({
      color: '#172434',
      metalness: 0.5,
      roughness: 0.4,
    });
  function box(
    parent: T.Object3D,
    size: [number, number, number],
    pos: [number, number, number],
    mat: T.Material,
  ) {
    const m = new T.Mesh(new T.BoxGeometry(...size), mat);
    m.position.set(...pos);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function tube(parent: T.Object3D, p: number[][], color: string, r = 0.03) {
    const curve = new T.CatmullRomCurve3(
      p.map((v) => new T.Vector3(...(v as [number, number, number]))),
    );
    const m = new T.Mesh(
      new T.TubeGeometry(curve, 40, r, 8, false),
      new T.MeshStandardMaterial({ color, roughness: 0.6 }),
    );
    parent.add(m);
  }
  const floor = new T.Mesh(
    new T.PlaneGeometry(70, 70),
    new T.MeshStandardMaterial({
      color: '#071019',
      metalness: 0,
      roughness: 1,
      envMapIntensity: 0.12,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.2;
  floor.receiveShadow = true;
  terminal.add(floor);
  gateway.add(floor.clone());
  tube(
    terminal,
    [
      [0, -0.7, 2],
      [0.1, -1.6, 2.8],
      [2, -2.15, 3.5],
      [4, -2.15, 2.4],
      [4, -1.3, 1.7],
    ],
    '#20292e',
    0.04,
  );
  function link(parent: T.Object3D, color: string, r = 0.015) {
    const g = new T.Group();
    parent.add(g);
    const mat = new T.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      blending: T.AdditiveBlending,
      depthWrite: false,
    });
    const core = new T.Mesh(new T.CylinderGeometry(r, r, 1, 8, 1, true), mat);
    g.add(core);
    const halo = new T.Mesh(
      new T.CylinderGeometry(r * 3, r * 3, 1, 8, 1, true),
      mat.clone(),
    );
    (halo.material as T.MeshBasicMaterial).opacity = 0.09;
    g.add(halo);
    const packets = Array.from({ length: 5 }, () => {
      const p = new T.Mesh(
        new T.SphereGeometry(r * 3.6, 10, 6),
        new T.MeshBasicMaterial({ color }),
      );
      g.add(p);
      return p;
    });
    return {
      g,
      update(
        a: T.Vector3,
        b: T.Vector3,
        t: number,
        visible = true,
        reverse = false,
      ) {
        g.visible = visible;
        if (!visible) return;
        const d = b.clone().sub(a);
        core.position.copy(a).addScaledVector(d, 0.5);
        core.scale.y = d.length();
        core.quaternion.setFromUnitVectors(
          new T.Vector3(0, 1, 0),
          d.clone().normalize(),
        );
        halo.position.copy(core.position);
        halo.scale.copy(core.scale);
        halo.quaternion.copy(core.quaternion);
        packets.forEach((p, i) => {
          let f = (t * 0.63 + i / 5) % 1;
          if (reverse) f = 1 - f;
          p.position.copy(a).addScaledVector(d, f);
        });
      },
    };
  }
  const rf = link(network, '#3ac6ff'),
    rfB = link(network, '#68dcff'),
    laser1 = link(network, '#ffce72'),
    laser2 = link(network, '#ffce72'),
    down = link(network, '#3ac6ff'),
    response = link(network, '#d5ef78');
  const wifi = link(terminal, '#d5ef78', 0.025),
    ethernet = link(terminal, '#d5ef78', 0.024),
    powerA = link(hero, '#ffce72', 0.023),
    powerB = link(hero, '#ffce72', 0.023),
    hookLink = link(hero, '#48c9ff', 0.035);
  const phone = new T.Group();
  terminal.add(phone);
  phone.position.set(6.3, -1.4, 3);
  phone.rotation.set(-0.3, -0.3, -0.2);
  box(phone, [0.64, 1.25, 0.08], [0, 0, 0], dark);
  box(
    phone,
    [0.55, 1.1, 0.012],
    [0, 0, 0.048],
    new T.MeshBasicMaterial({ color: '#173f52' }),
  );
  for (let i = 0; i < 4; i++)
    box(
      phone,
      [0.37, 0.032, 0.015],
      [0, 0.25 - i * 0.15, 0.059],
      new T.MeshBasicMaterial({ color: i === 0 ? '#d5ef78' : '#5590ab' }),
    );
  const radio = link(terminal, '#46caff', 0.035),
    fiber = link(gateway, '#d5ef78', 0.04),
    gatewayRadio = link(gateway, '#44bfff', 0.04);
  const beamGroup = new T.Group();
  terminal.add(beamGroup);
  const beamMat = new T.ShaderMaterial({
    transparent: true,
    side: T.DoubleSide,
    blending: T.AdditiveBlending,
    depthWrite: false,
    uniforms: { time: { value: 0 }, blocked: { value: 0 } },
    vertexShader:
      'varying vec2 uvv;void main(){uvv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:
      'uniform float time;uniform float blocked;varying vec2 uvv;void main(){float s=pow(max(0.,sin(uvv.y*65.-time*13.)),13.);gl_FragColor=vec4(mix(vec3(.12,.68,1.),vec3(1.,.2,.12),blocked),(.04+s*.22)*(1.-uvv.y*.7));}',
  });
  const beam = new T.Mesh(
    new T.CylinderGeometry(1.6, 0.15, 10, 48, 1, true),
    beamMat,
  );
  beam.position.y = 5;
  beamGroup.add(beam);
  const wavelets = Array.from({ length: 9 }, () => {
    const m = new T.Mesh(
      new T.TorusGeometry(1, 0.009, 5, 80),
      new T.MeshBasicMaterial({
        color: '#62d8ff',
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      }),
    );
    terminal.add(m);
    return m;
  });
  const patches = new T.InstancedMesh(
    new T.SphereGeometry(0.011, 8, 6),
    new T.MeshBasicMaterial({ color: '#69e3ff' }),
    216,
  );
  dish.add(patches);
  const matrix = new T.Matrix4(),
    q = new T.Quaternion();
  const sats = Array.from({ length: 3 }, () => {
    const g = new T.Group();
    network.add(g);
    return g;
  });
  function marker(color: string) {
    const g = new T.Group();
    network.add(g);
    g.add(
      new T.Mesh(
        new T.SphereGeometry(0.055, 12, 8),
        new T.MeshBasicMaterial({ color }),
      ),
    );
    g.add(
      new T.Mesh(
        new T.TorusGeometry(0.12, 0.011, 6, 40),
        new T.MeshBasicMaterial({ color }),
      ),
    );
    return g;
  }
  const homeMarker = marker('#62d4ff'),
    gatewayMarker = marker('#d5ef78');
  for (let i = 0; i < 7; i++) {
    const pts = [];
    for (let j = 0; j <= 200; j++) {
      const a = (j / 200) * Math.PI * 2;
      pts.push(
        new T.Vector3(
          Math.sin(a) * 5.377,
          Math.cos(a) * Math.sin(i * 0.48) * 5.377,
          Math.cos(a) * Math.cos(i * 0.48) * 5.377,
        ),
      );
    }
    network.add(
      new T.Line(
        new T.BufferGeometry().setFromPoints(pts),
        new T.LineBasicMaterial({
          color: '#397d99',
          transparent: true,
          opacity: 0.15,
        }),
      ),
    );
  }
  function orbit(a: number) {
    return new T.Vector3(Math.sin(a), Math.sin(a) * 0.22, Math.cos(a))
      .normalize()
      .multiplyScalar(5.377);
  }
  for (let i = 0; i < 3; i++) {
    const g = new T.Group();
    g.position.set(-4 + i * 2.1, -1.2, -1);
    gateway.add(g);
    box(g, [1, 0.2, 1], [0, -0.89, 0], dark);
    box(g, [0.16, 1.25, 0.16], [0, -0.2, 0], metal);
    const dg = new T.Group();
    dg.position.y = 0.55;
    dg.rotation.x = 0.5;
    g.add(dg);
    const profile = [];
    for (let j = 0; j <= 24; j++) {
      const r = (j / 24) * 0.9;
      profile.push(new T.Vector2(r, r * r * 0.3));
    }
    dg.add(
      new T.Mesh(
        new T.LatheGeometry(profile, 80),
        new T.MeshStandardMaterial({
          color: '#dfe5e9',
          metalness: 0.45,
          roughness: 0.3,
          side: T.DoubleSide,
        }),
      ),
    );
    tube(
      dg,
      [
        [0, 0, 0],
        [0.7, 0.7, 0],
        [0, 1, 0],
      ],
      '#b5c0c9',
      0.025,
    );
    box(dg, [0.16, 0.18, 0.24], [0, 1, 0], dark);
  }
  box(gateway, [1.7, 3.4, 1.4], [4, -0.45, 0.2], dark);
  for (let i = 0; i < 10; i++) {
    box(gateway, [1.43, 0.22, 0.06], [4, -1.78 + i * 0.27, 0.93], metal);
    for (let j = 0; j < 5; j++)
      box(
        gateway,
        [0.045, 0.024, 0.02],
        [3.42 + j * 0.12, -1.76 + i * 0.27, 0.97],
        new T.MeshBasicMaterial({ color: i % 3 ? '#75daee' : '#c8ef81' }),
      );
  }
  tube(
    gateway,
    [
      [-1, -2.1, 0],
      [-1, -2.1, 2],
      [4, -2.1, 2],
      [4, -1.7, 0.8],
    ],
    '#9cc56a',
    0.05,
  );
  const tree = new T.Group();
  terminal.add(tree);
  tree.position.set(-5.6, 1.8, 2.3);
  tree.scale.set(1.2, 2, 1.2);
  box(
    tree,
    [0.22, 4, 0.22],
    [0, 0, 0],
    new T.MeshStandardMaterial({ color: '#634d35', roughness: 0.95 }),
  );
  for (let i = 0; i < 5; i++) {
    const m = new T.Mesh(
      new T.IcosahedronGeometry(1.4 - i * 0.15, 2),
      new T.MeshStandardMaterial({
        color: i % 2 ? '#183c32' : '#235244',
        roughness: 0.98,
      }),
    );
    m.position.set(Math.sin(i * 2) * 0.45, 1 + i * 0.45, Math.cos(i * 2) * 0.3);
    m.castShadow = true;
    tree.add(m);
  }
  let disposed = false,
    capturing = false,
    portrait = false,
    width = 1,
    height = 1,
    lastKey = '',
    manual = false,
    assembly = 0;
  const ready = new GLTFLoader()
    .loadAsync('/models/starlink-hardware.glb')
    .then((gltf) => {
      if (disposed) return;
      // Reparenting mutates the source array; iterate a snapshot.
      for (const node of gltf.scene.children.slice()) {
        node.traverse((o) => {
          if (o instanceof T.Mesh) {
            o.castShadow = true;
            o.receiveShadow = true;
          }
        });
        parts.set(node.name, node);
        if (node.name.startsWith('satellite_')) {
          satellite.add(node);
          node.userData.select =
            node.name === 'satellite_lasers' ? 'lasers' : 'satellite';
          pickables.push(node);
        } else if (node.name.startsWith('terminal_')) {
          dish.add(node);
          node.userData.select = 'beam';
          pickables.push(node);
        } else if (node.name === 'router') {
          node.scale.setScalar(9);
          node.position.set(4, -1.6, 1.5);
          terminal.add(node);
        }
      }
      sats.forEach((g) => {
        const clone = satellite.clone(true);
        clone.scale.setScalar(0.035);
        g.add(clone);
      });
    });
  const capture = document.createElement('canvas'),
    captureCtx = capture.getContext('2d')!;
  let last: Display = {
    view: 'overview',
    time: 0,
    angle: 0,
    explode: 0,
    blocked: false,
    lasers: true,
    guided: false,
  };
  function resize() {
    if (disposed) return;
    width = capturing
      ? portrait
        ? 1080
        : 1920
      : Math.max(1, host.clientWidth);
    height = capturing
      ? portrait
        ? 1920
        : 1080
      : Math.max(1, host.clientHeight);
    renderer.setPixelRatio(
      capturing ? 1 : Math.min(window.devicePixelRatio, 1.6),
    );
    renderer.setSize(width, height, false);
    overlay.width = width;
    overlay.height = height;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(() => {
    if (!capturing) resize();
  });
  observer.observe(host);
  resize();
  controls.addEventListener('start', () => {
    manual = true;
  });
  let px = 0,
    py = 0;
  const downPointer = (e: PointerEvent) => {
    px = e.clientX;
    py = e.clientY;
  };
  const upPointer = (e: PointerEvent) => {
    if (Math.hypot(e.clientX - px, e.clientY - py) > 5 || last.guided) return;
    const r = renderer.domElement.getBoundingClientRect();
    const ray = new T.Raycaster();
    ray.setFromCamera(
      new T.Vector2(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        (-(e.clientY - r.top) / r.height) * 2 + 1,
      ),
      camera,
    );
    for (const h of ray.intersectObjects(pickables, true)) {
      let o: T.Object3D | null = h.object;
      let visible = true;
      while (o) {
        if (!o.visible) visible = false;
        o = o.parent;
      }
      if (!visible) continue;
      o = h.object;
      while (o && !o.userData.select) o = o.parent;
      if (o) {
        onSelect(o.userData.select as View);
        break;
      }
    }
  };
  renderer.domElement.addEventListener('pointerdown', downPointer);
  renderer.domElement.addEventListener('pointerup', upPointer);
  function wrap(
    text: string,
    x: number,
    y: number,
    w: number,
    lineHeight: number,
  ) {
    let line = '';
    for (const word of text.split(' ')) {
      const candidate = line ? line + ' ' + word : word;
      if (ctx.measureText(candidate).width > w && line) {
        ctx.fillText(line, x, y);
        y += lineHeight;
        line = word;
      } else line = candidate;
    }
    ctx.fillText(line, x, y);
  }
  function hud(
    d: Display,
    labels: { text: string; p: T.Vector3; color: string }[],
  ) {
    ctx.clearRect(0, 0, width, height);
    const p = width < height,
      scale = width / (p ? 1080 : 1920),
      w = width / scale,
      h = height / scale;
    ctx.save();
    ctx.scale(scale, scale);
    const shade = ctx.createLinearGradient(0, 0, 0, p ? 420 : 225);
    shade.addColorStop(0, 'rgba(2,8,16,.9)');
    shade.addColorStop(1, 'rgba(2,8,16,0)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, w, p ? 420 : 225);
    ctx.save();
    if (p) ctx.translate(10, 55);
    drawRecordingBrand(ctx);
    ctx.restore();
    if (d.title) {
      ctx.fillStyle = '#a9c5d5';
      ctx.font = '600 ' + (p ? 23 : 20) + 'px Arial';
      ctx.fillText(
        d.kicker ?? 'STARLINK / INTERACTIVE LAB',
        p ? 52 : 44,
        p ? 159 : 108,
      );
      ctx.fillStyle = '#f2f8fc';
      ctx.font = '600 ' + (p ? 54 : 43) + 'px Arial';
      wrap(
        d.title,
        p ? 52 : 44,
        p ? 227 : 165,
        w - (p ? 170 : 90),
        p ? 62 : 51,
      );
    }
    ctx.fillStyle = '#8daabe';
    ctx.font = (p ? 19 : 16) + 'px Arial';
    ctx.fillText(
      'Educational reconstruction · motion and sizes illustrative',
      p ? 50 : 44,
      h - (p ? 188 : 30),
    );
    if (d.progress !== undefined) {
      ctx.fillStyle = '#d5ef78';
      ctx.fillRect(
        p ? 50 : 44,
        h - (p ? 156 : 13),
        (w - (p ? 140 : 88)) * d.progress,
        3,
      );
    }
    if (d.shotId === 'explore') {
      ctx.fillStyle = '#d5ef78';
      ctx.font = '600 ' + (p ? 36 : 28) + 'px Arial';
      ctx.fillText(
        'howthingsclick.com/starlink',
        p ? 50 : w - 510,
        h - (p ? 245 : 65),
      );
    }
    ctx.restore();
    const occupied: { x: number; y: number; w: number; h: number }[] = [];
    labels.forEach((l, i) => {
      if (p && i > 1) return;
      const v = l.p.clone().project(camera);
      if (v.z > 1 || Math.abs(v.x) > 0.85 || Math.abs(v.y) > 0.7) return;
      const x = (v.x * 0.5 + 0.5) * width,
        y = (-v.y * 0.5 + 0.5) * height,
        fs = Math.max(12, width / (p ? 39 : 110));
      ctx.font = '500 ' + fs + 'px Arial';
      const tw = ctx.measureText(l.text).width,
        left = Math.min(width - tw - 24, Math.max(18, x + 24));
      let ly = Math.max(height * 0.27, y - 18);
      for (let attempt = 0; attempt < 5; attempt++) {
        if (
          !occupied.some(
            (r) =>
              left < r.x + r.w + 10 &&
              left + tw + 16 > r.x - 10 &&
              ly - fs < r.y + r.h + 10 &&
              ly + 12 > r.y - 10,
          )
        )
          break;
        ly += fs + 28;
      }
      ly = Math.min(ly, height * 0.82);
      occupied.push({ x: left - 8, y: ly - fs, w: tw + 16, h: fs + 15 });
      ctx.strokeStyle = l.color;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(left, ly);
      ctx.stroke();
      ctx.fillStyle = 'rgba(3,12,22,.88)';
      ctx.fillRect(left - 8, ly - fs, tw + 16, fs + 15);
      ctx.fillStyle = l.color;
      ctx.fillText(l.text, left, ly + 6);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  function update(d: Display, dt = 0.016) {
    if (disposed) return;
    last = d;
    const t = d.time,
      p = !!d.portrait || width < height;
    const nw =
        ['lasers', 'handoff'].includes(d.view) ||
        (d.view === 'overview' && d.shotId === 'orbit'),
      tr = ['terminal', 'beam', 'obstruction'].includes(d.view);
    hero.visible = !nw && !tr && d.view !== 'gateway';
    network.visible = nw;
    terminal.visible = tr;
    gateway.visible = d.view === 'gateway';
    stars.visible = !tr && d.view !== 'gateway';
    const labels: { text: string; p: T.Vector3; color: string }[] = [];
    const label = (text: string, p: T.Vector3, color = '#b7dced') =>
      labels.push({ text, p, color });
    tree.visible = d.view === 'obstruction' && d.blocked;
    planet.clouds.rotation.y = globe.clouds.rotation.y = 2.2 + t * 0.0008;
    satellite.quaternion.setFromUnitVectors(
      new T.Vector3(0, 1, 0),
      new T.Vector3(0.08, 0.84, 0.54).normalize(),
    );
    satellite.rotateY(p ? 1.05 : Math.sin(t * 0.14) * 0.12 - 0.12);
    assembly += (d.explode - assembly) * (dt === 0 ? 1 : 1 - Math.exp(-dt * 8));
    const separation = assembly;
    for (const [name, o] of parts) {
      if (name.startsWith('satellite_')) {
        o.position.y =
          name === 'satellite_antennas'
            ? separation * 1.45
            : name === 'satellite_avionics'
              ? separation * 0.7
              : name === 'satellite_thermal'
                ? -separation * 0.95
                : 0;
        if (name === 'satellite_antennas') o.position.x = -separation * 2.5;
        if (name.startsWith('satellite_wing'))
          o.position.x = (name.endsWith('left') ? -1 : 1) * separation * 1.4;
      } else if (name.startsWith('terminal_')) {
        o.position.y =
          name === 'terminal_radome'
            ? separation * 0.18
            : name === 'terminal_array'
              ? separation * 0.055
              : 0;
        if (name === 'terminal_radome') {
          o.position.x = -separation * 0.36;
          o.position.z = -separation * 0.14;
          o.rotation.z = -separation * 0.18;
        }
      }
    }
    const showBeam = d.view === 'beam' || d.view === 'obstruction';
    beamGroup.visible = showBeam;
    patches.visible = d.view === 'beam' && d.explode > 0.15;
    const direction =
      d.view === 'obstruction'
        ? new T.Vector3(-5.6, 5.25, 2.2).normalize()
        : new T.Vector3(
            Math.sin((d.angle * Math.PI) / 180),
            Math.cos((d.angle * Math.PI) / 180),
            0.27,
          ).normalize();
    beamGroup.position.set(0, 0.75, 0.1);
    beamGroup.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), direction);
    beamMat.uniforms.time.value = t;
    beamMat.uniforms.blocked.value = +d.blocked;
    beam.scale.y = d.blocked ? 0.8 : 1;
    beam.position.y = d.blocked ? 4 : 5;
    const end = beamGroup.position
      .clone()
      .addScaledVector(direction, d.blocked ? 8 : 10);
    radio.update(beamGroup.position, end, t, tr);
    wifi.update(
      new T.Vector3(6.3, -1.1, 3),
      new T.Vector3(4, -1.1, 1.5),
      t,
      d.view === 'terminal',
    );
    ethernet.update(
      new T.Vector3(4, -1.3, 1.5),
      new T.Vector3(0, -0.7, 2),
      t,
      d.view === 'terminal',
    );
    phone.visible = d.view === 'terminal';
    let ix = 0;
    for (let x = 0; x < 12; x++)
      for (let y = 0; y < 18; y++) {
        const n =
          0.5 +
          0.5 *
            Math.sin(t * 9 - x * Math.sin((d.angle * Math.PI) / 180) * Math.PI);
        matrix.compose(
          new T.Vector3(
            -0.162 + x * 0.0294,
            0.024 + separation * 0.055,
            0.257 - y * 0.0302,
          ),
          q,
          new T.Vector3().setScalar(0.3 + n * 0.35),
        );
        patches.setMatrixAt(ix++, matrix);
      }
    patches.instanceMatrix.needsUpdate = true;
    wavelets.forEach((m, i) => {
      m.visible = d.view === 'beam';
      const f = (t * 0.8 + i / 9) % 1;
      m.scale.setScalar(0.3 + f * 3.7);
      m.position.copy(beamGroup.position).addScaledVector(direction, f * 8);
      m.quaternion.copy(beamGroup.quaternion);
      m.rotateX(-Math.PI / 2);
      (m.material as T.MeshBasicMaterial).opacity = (1 - f) * 0.14;
    });
    const drift = Math.sin(t * 0.16) * 0.06,
      a = orbit(0.33 + drift),
      b = orbit(-0.14 + drift),
      c = orbit(-0.6 + drift),
      home = orbit(0.12).normalize().multiplyScalar(5.02),
      ground = orbit(d.lasers ? -0.62 : 0.18)
        .normalize()
        .multiplyScalar(5.02);
    [a, b, c].forEach((v, i) => {
      sats[i].position.copy(v);
      sats[i].quaternion.setFromUnitVectors(
        new T.Vector3(0, 1, 0),
        v.clone().normalize(),
      );
    });
    homeMarker.position.copy(home);
    gatewayMarker.position.copy(ground);
    homeMarker.lookAt(home.clone().multiplyScalar(2));
    gatewayMarker.lookAt(ground.clone().multiplyScalar(2));
    const handoff = handoffAt(d.localTime ?? t),
      sw = d.view === 'handoff';
    rf.update(home, a, t, !sw || handoff.blend < 0.97);
    rfB.update(home, b, t, sw && handoff.blend > 0.03);
    laser1.update(a, b, t, d.lasers && !sw);
    laser2.update(b, c, t, d.lasers && !sw);
    down.update(d.lasers ? c : a, ground, t, !sw);
    response.update(home, a, t, nw && !sw, true);
    if (nw) {
      label('YOUR TERMINAL', home, '#71d6ff');
      label(sw ? 'INCOMING SATELLITE' : 'LASER LINK', b, '#ffd18a');
      label('GROUND GATEWAY', ground, '#d5ef89');
    }
    fiber.update(new T.Vector3(-1, -1.9, 1), new T.Vector3(4, -1.9, 1), t);
    gatewayRadio.update(new T.Vector3(-1, 0, 0), new T.Vector3(-4, 7, -4), t);
    if (d.view === 'gateway') {
      label('GROUND GATEWAY', new T.Vector3(-3, 0.2, 0));
      label('INTERNET SERVICE', new T.Vector3(4, 1, 0.95), '#d5ef89');
    }
    satellite.updateMatrixWorld(true);
    const satPoint = (x: number, y: number, z: number) =>
      satellite.localToWorld(new T.Vector3(x, y, z));
    hookLink.update(
      new T.Vector3(3, -11, -20),
      satPoint(0, 0.1, 0),
      t,
      d.view === 'overview' && !nw,
    );
    powerA.update(
      satPoint(-7, 0.2, 0),
      satPoint(0, 0.2 + separation * 0.7, 0),
      t,
      d.view === 'satellite' && separation > 0.3,
    );
    powerB.update(
      satPoint(7, 0.2, 0),
      satPoint(0, 0.2 + separation * 0.7, 0),
      t,
      d.view === 'satellite' && separation > 0.3,
    );
    if (d.view === 'satellite') {
      label(
        'RF ANTENNA PANELS',
        satPoint(-separation * 2.5, 0.3 + separation * 1.45, 1),
      );
      label('OPTICAL TERMINALS', satPoint(0, 0.3, -2.3), '#ffda95');
      if (d.explode > 0.3)
        label(
          'ONBOARD ELECTRONICS',
          satPoint(1, separation * 0.7, 0),
          '#aee8cc',
        );
    }
    if (tr) {
      label(
        d.view === 'beam' ? 'PHASED ARRAY' : 'STANDARD 4 X TERMINAL',
        new T.Vector3(-1, 0.4 + d.explode * 1.5, 1),
      );
      if (d.view === 'terminal')
        label('WI-FI ROUTER', new T.Vector3(4, -1, 1.5));
      if (d.blocked) label('BLOCKED LINE OF SIGHT', end, '#ff9b75');
    }
    const key = d.view + (nw ? 'network' : '') + (p ? 'portrait' : '');
    if (key !== lastKey) {
      lastKey = key;
      manual = false;
    }
    let pos: T.Vector3, target: T.Vector3;
    if (nw) {
      const whole = d.shotId === 'orbit';
      pos = whole
        ? new T.Vector3(p ? 4.4 : 7.4, 3.2, p ? 15.5 : 12.6)
        : new T.Vector3(0, p ? 4.7 : 2.6, p ? 18 : 13);
      target = whole
        ? new T.Vector3(0, 0, 0.5)
        : new T.Vector3(-0.4, 0, p ? 3 : 4.3);
    } else if (tr) {
      pos =
        d.view === 'obstruction'
          ? new T.Vector3(8, 10, p ? 32 : 20)
          : new T.Vector3(p ? 7 : 8, p ? 9 : 8, p ? 22 : 15);
      target = new T.Vector3(
        d.view === 'obstruction' ? -1 : d.view === 'terminal' ? 0.7 : 0,
        showBeam ? 2.1 : 0,
        0,
      );
    } else if (d.view === 'gateway') {
      pos = new T.Vector3(10, 6, p ? 20 : 13);
      target = new T.Vector3(0.5, 0, 0);
    } else {
      pos = new T.Vector3(
        d.view === 'satellite' ? 3 : 5,
        p ? 16 : 18,
        p ? 32 : d.view === 'satellite' ? 17 : 22,
      );
      target = new T.Vector3(0, 0, 0);
    }
    if (d.shotId === 'hook') {
      const push = Math.min(1, (d.localTime ?? 0) / 3);
      pos.add(new T.Vector3(2 * (1 - push), -1.5 * (1 - push), 3 * (1 - push)));
    }
    if (d.view === 'satellite' && d.guided) {
      const beat = (d.localTime ?? 0) * (d.portrait ? 16 / 9 : 1);
      if (beat > 3 && beat < 7) {
        target = satPoint(0, separation * 0.7, 0);
        pos = target.clone().add(new T.Vector3(p ? 1 : 3, 7, p ? 13 : 9));
      } else if (beat > 9 && beat < 13) {
        target = satPoint(0, 0.3, -2.3);
        pos = target.clone().add(new T.Vector3(1, 4, p ? 9 : 6));
      }
    }
    if (d.guided) {
      pos.x += Math.sin(t * 0.28) * 1.2;
      pos.y += Math.sin(t * 0.24) * 0.55;
      manual = false;
    }
    if (!manual) {
      const mix = dt === 0 ? 1 : 1 - Math.exp(-dt * 5);
      camera.position.lerp(pos, mix);
      controls.target.lerp(target, mix);
    }
    controls.enabled = !d.guided;
    controls.update();
    renderer.render(scene, camera);
    hud(d, labels);
    if (capturing) {
      captureCtx.drawImage(
        renderer.domElement,
        0,
        0,
        capture.width,
        capture.height,
      );
      captureCtx.drawImage(overlay, 0, 0, capture.width, capture.height);
    }
  }
  return {
    frameCanvas: () => capture,
    ready: Promise.all([ready, textureReady]),
    update,
    resetCamera() {
      manual = false;
      lastKey = '';
      update(last, 0);
    },
    startCapture(d: Display, format: 'full' | 'short') {
      capturing = true;
      portrait = format === 'short';
      capture.width = portrait ? 1080 : 1920;
      capture.height = portrait ? 1920 : 1080;
      resize();
      update({ ...d, portrait }, 0);
      return capture.captureStream(30);
    },
    endCapture() {
      capturing = false;
      resize();
      update(last, 0);
    },
    still() {
      const wasCapturing = capturing,
        wasPortrait = portrait;
      capturing = true;
      portrait = false;
      resize();
      update({ ...last, portrait: false }, 0);
      const c = document.createElement('canvas');
      c.width = 1920;
      c.height = 1080;
      const x = c.getContext('2d')!;
      x.drawImage(renderer.domElement, 0, 0, 1920, 1080);
      x.drawImage(overlay, 0, 0, 1920, 1080);
      capturing = wasCapturing;
      portrait = wasPortrait;
      resize();
      return new Promise<Blob | null>((r) => c.toBlob(r, 'image/png'));
    },
    dispose() {
      disposed = true;
      observer.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', downPointer);
      renderer.domElement.removeEventListener('pointerup', upPointer);
      scene.traverse((o) => {
        if (
          o instanceof T.Mesh ||
          o instanceof T.Points ||
          o instanceof T.Line
        ) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            m.dispose(),
          );
        }
      });
      textures.forEach((t) => t.dispose());
      env.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      overlay.remove();
    },
  };
}
