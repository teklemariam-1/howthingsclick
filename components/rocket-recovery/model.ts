import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { legPitch, legGeometry } from '@/lib/rocket-recovery/geometry';
import type { Vehicle } from '@/lib/rocket-recovery/simulation';
const mat = (color: string, metalness = 0, roughness = 0.5) =>
  new T.MeshStandardMaterial({ color, metalness, roughness });
export const materials = {
  steel: mat('#aeb6bf', 0.88, 0.29),
  dark: mat('#26313a', 0.65, 0.43),
  black: mat('#111922', 0.4, 0.45),
  white: mat('#dddeda', 0.3, 0.48),
  gold: mat('#bfa56f', 0.72, 0.35),
  rubber: mat('#141820', 0.1, 0.82),
  concrete: mat('#59666b', 0.08, 0.9),
  deck: mat('#25313b', 0.6, 0.65),
  orange: mat('#e59544', 0.4, 0.45),
  rail: mat('#bbc6cc', 0.65, 0.42),
};
function mesh(
  parent: T.Object3D,
  geo: T.BufferGeometry,
  material: T.Material,
  pos: [number, number, number],
  rotation?: [number, number, number],
) {
  const m = new T.Mesh(geo, material);
  m.position.set(...pos);
  if (rotation) m.rotation.set(...rotation);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
export const box = (
  p: T.Object3D,
  size: [number, number, number],
  pos: [number, number, number],
  m: T.Material,
) => mesh(p, new T.BoxGeometry(...size), m, pos);
export const cylinder = (
  p: T.Object3D,
  r: number,
  h: number,
  pos: [number, number, number],
  m: T.Material,
  r2 = r,
) => mesh(p, new T.CylinderGeometry(r2, r, h, 64, 1), m, pos);
export function link(
  p: T.Object3D,
  a: T.Vector3,
  b: T.Vector3,
  r: number,
  m: T.Material,
) {
  const part = mesh(
    p,
    new T.CylinderGeometry(r, r, a.distanceTo(b), 8),
    m,
    [0, 0, 0],
  );
  part.position.copy(a).add(b).multiplyScalar(0.5);
  part.quaternion.setFromUnitVectors(
    new T.Vector3(0, 1, 0),
    b.clone().sub(a).normalize(),
  );
  return part;
}
function ring(p: T.Object3D, r: number, t: number, y: number, m: T.Material) {
  return mesh(
    p,
    new T.TorusGeometry(r, t, 6, 96),
    m,
    [0, y, 0],
    [Math.PI / 2, 0, 0],
  );
}
function group(parent: T.Object3D, name: string) {
  const g = new T.Group();
  g.name = name;
  g.userData.part = name;
  parent.add(g);
  return g;
}
export function mergeStatic(g: T.Group) {
  g.updateMatrixWorld(true);
  const buckets = new Map<T.Material, T.BufferGeometry[]>();
  for (const o of g.children.slice())
    if (o instanceof T.Mesh && !Array.isArray(o.material)) {
      const geometry = o.geometry.clone().applyMatrix4(o.matrix);
      const list = buckets.get(o.material) ?? [];
      list.push(geometry);
      buckets.set(o.material, list);
      g.remove(o);
      o.geometry.dispose();
    }
  for (const [material, geometries] of buckets) {
    const geometry = mergeGeometries(geometries, false);
    for (const geo of geometries) geo.dispose();
    if (geometry) {
      const m = new T.Mesh(geometry, material);
      m.castShadow = true;
      m.receiveShadow = true;
      g.add(m);
    }
  }
}
function labelTexture(
  text: string,
  wide = 1024,
  tall = 128,
  color = '#192d3c',
) {
  const c = document.createElement('canvas');
  c.width = wide;
  c.height = tall;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.font = '700 ' + tall * 0.62 + 'px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, wide / 2, tall / 2);
  const tex = new T.CanvasTexture(c);
  tex.colorSpace = T.SRGBColorSpace;
  return tex;
}
function decal(
  p: T.Object3D,
  text: string,
  w: number,
  h: number,
  pos: [number, number, number],
  color = '#152835',
) {
  const m = new T.MeshBasicMaterial({
    map: labelTexture(text, 1024, 128, color),
    transparent: true,
    depthWrite: false,
    side: T.DoubleSide,
  });
  return mesh(p, new T.PlaneGeometry(w, h), m, pos);
}
function metalTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 1024;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#a9acb0';
  ctx.fillRect(0, 0, 512, 1024);
  let seed = 7181;
  for (let i = 0; i < 7000; i++) {
    seed = (seed * 16807) % 2147483647;
    const v = seed / 2147483647;
    ctx.fillStyle = 'rgba(' + (v > 0.5 ? '230,235,240' : '45,48,52') + ',.075)';
    ctx.fillRect(0, Math.floor(v * 1024), 512, 0.45);
  }
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  return t;
}
function falconTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 2048;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#d2d2c9';
  ctx.fillRect(0, 0, 1024, 2048);
  const wash = ctx.createLinearGradient(0, 900, 0, 2048);
  wash.addColorStop(0, 'rgba(48,39,29,0)');
  wash.addColorStop(0.6, 'rgba(69,57,43,.16)');
  wash.addColorStop(1, 'rgba(31,28,25,.64)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 800, 1024, 1248);
  let seed = 7331;
  for (let i = 0; i < 750; i++) {
    seed = (seed * 16807) % 2147483647;
    const x = seed % 1024;
    seed = (seed * 16807) % 2147483647;
    const len = 130 + (seed % 530);
    const g = ctx.createLinearGradient(x, 2048 - len, x, 2048);
    g.addColorStop(0, 'rgba(30,29,26,0)');
    g.addColorStop(1, 'rgba(30,29,26,.12)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 2048 - len, 2 + (i % 9), len);
  }
  const tex = new T.CanvasTexture(c);
  tex.colorSpace = T.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
function bell(
  p: T.Object3D,
  r: number,
  length: number,
  pos: [number, number, number],
  metal: T.Material,
) {
  const profile = [
    [r, 0],
    [r * 0.94, length * 0.1],
    [r * 0.82, length * 0.25],
    [r * 0.64, length * 0.43],
    [r * 0.44, length * 0.61],
    [r * 0.29, length * 0.79],
    [r * 0.23, length * 0.91],
    [r * 0.25, length],
  ].map(([x, y]) => new T.Vector2(x, y));
  const b = mesh(p, new T.LatheGeometry(profile, 48), metal, pos);
  mesh(p, new T.TorusGeometry(r, 0.027, 8, 48), materials.dark, pos, [
    Math.PI / 2,
    0,
    0,
  ]);
  cylinder(
    p,
    r * 0.18,
    0.06,
    [pos[0], pos[1] + length * 0.93, pos[2]],
    materials.black,
  );
  // Chamber, turbopump, feed lines and support links remain visible in an exploded close-up.
  cylinder(
    p,
    r * 0.27,
    length * 0.25,
    [pos[0], pos[1] + length * 1.1, pos[2]],
    materials.dark,
  );
  const pump = cylinder(
    p,
    r * 0.24,
    r * 0.72,
    [pos[0] + r * 0.48, pos[1] + length * 1.12, pos[2]],
    materials.steel,
  );
  pump.rotation.z = Math.PI / 2;
  for (const side of [-1, 1]) {
    link(
      p,
      new T.Vector3(
        pos[0] + side * r * 0.52,
        pos[1] + length * 1.24,
        pos[2] + r * 0.24,
      ),
      new T.Vector3(
        pos[0] + side * r * 0.34,
        pos[1] + length * 0.65,
        pos[2] + r * 0.24,
      ),
      r * 0.055,
      materials.rail,
    );
    link(
      p,
      new T.Vector3(
        pos[0] + side * r * 0.65,
        pos[1] + length * 1.3,
        pos[2] - r * 0.1,
      ),
      new T.Vector3(pos[0] + side * r * 0.16, pos[1] + length * 0.96, pos[2]),
      r * 0.045,
      materials.dark,
    );
  }
  for (let j = 1; j < 16; j++) {
    const f = j / 16;
    let at = 0;
    while (at < profile.length - 2 && profile[at + 1].y < f * length) at++;
    const a = profile[at],
      c = profile[at + 1],
      radius = T.MathUtils.lerp(a.x, c.x, (f * length - a.y) / (c.y - a.y));
    const cooling = new T.Mesh(
      new T.TorusGeometry(radius + 0.003, r * 0.011, 5, 40),
      materials.dark,
    );
    cooling.rotation.x = Math.PI / 2;
    cooling.position.set(pos[0], pos[1] + f * length, pos[2]);
    p.add(cooling);
  }
  return b;
}
export type Rocket = ReturnType<typeof createRocket>;
export function createRocket(vehicle: Vehicle) {
  const root = new T.Group(),
    heavy = vehicle === 'superheavy',
    r = heavy ? 4.5 : 1.85,
    h = heavy ? 71 : 42;
  const skin = group(root, 'Propellant tanks'),
    engines = group(root, 'Engine cluster'),
    fins: T.Group[] = [],
    legs: T.Group[] = [];
  const stainless = materials.steel.clone();
  stainless.map = metalTexture();
  stainless.roughness = 0.34;
  const paint = materials.white.clone();
  paint.map = falconTexture();
  paint.metalness = 0.12;
  paint.roughness = 0.72;
  const shellMat = heavy ? stainless : paint;
  cylinder(skin, r, h - 3, [0, (h + 3) / 2, 0], shellMat);
  // Rounded tank domes and external longitudinal plumbing.
  const top = mesh(
    skin,
    new T.SphereGeometry(r, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    shellMat,
    [0, h - 0.1, 0],
  );
  top.scale.y = 0.23;
  for (let y = 4; y < h; y += heavy ? 1.8 : 3.1)
    ring(
      skin,
      r + 0.014,
      heavy ? 0.035 : 0.016,
      y,
      heavy ? materials.steel : materials.rail,
    );
  for (const a of [1.8, 4.4]) {
    const x = Math.cos(a) * (r + 0.12),
      z = Math.sin(a) * (r + 0.12);
    cylinder(
      skin,
      heavy ? 0.1 : 0.055,
      h - 7,
      [x, (h + 5) / 2, z],
      materials.rail,
    );
    for (let y = 6; y < h - 2; y += 4)
      box(skin, [0.26, 0.14, 0.26], [x, y, z], materials.dark);
  }
  if (!heavy) {
    cylinder(skin, r + 0.016, 6, [0, h - 2.1, 0], materials.black);
    decal(skin, 'FALCON 9', 2.8, 0.45, [0, 26, r + 0.035]);
    decal(skin, 'SPACEX', 2.75, 0.48, [0, 15, r + 0.035]);
  } else {
    // Long engine shielding pods and booster catch interfaces.
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      box(
        skin,
        [0.75, 8.5, 0.35],
        [Math.sin(a) * (r + 0.08), 6.2, Math.cos(a) * (r + 0.08)],
        materials.dark,
      ).rotation.y = a;
    }
    for (const z of [-1, 1]) {
      const pin = cylinder(
        skin,
        0.23,
        1.65,
        [0, 64, z * 4.85],
        materials.steel,
      );
      pin.rotation.x = Math.PI / 2;
      box(skin, [1.2, 1.7, 0.32], [0, 63.9, z * 4.5], materials.dark);
    }
    decal(skin, 'BOOSTER', 5, 0.6, [0, 40, r + 0.03], '#404950');
  }
  mergeStatic(skin);
  cylinder(engines, r * 0.92, 0.6, [0, 2.5, 0], materials.dark);
  const engineMetal = mat('#535a5b', 0.76, 0.46);
  engineMetal.side = T.DoubleSide;
  const locations: [number, number][] = [];
  if (heavy) {
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      locations.push([Math.sin(a) * 3.68, Math.cos(a) * 3.68]);
    }
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      locations.push([Math.sin(a) * 2.12, Math.cos(a) * 2.12]);
    }
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      locations.push([Math.sin(a) * 0.84, Math.cos(a) * 0.84]);
    }
  } else {
    locations.push([0, 0]);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      locations.push([Math.sin(a) * 1.14, Math.cos(a) * 1.14]);
    }
  }
  for (const [x, z] of locations) {
    bell(
      engines,
      heavy ? 0.61 : 0.42,
      heavy ? 2.5 : 1.85,
      [x, 0, z],
      engineMetal,
    );
    cylinder(engines, 0.11, 0.8, [x, 2.5, z], materials.gold);
  }
  mergeStatic(engines);
  // Gimbal about the upper thrust mount, never about the nozzle exit.
  engines.children.forEach((part) => {
    part.position.y -= 3;
  });
  engines.position.y = 3;
  cylinder(skin, r * 0.98, 0.4, [0, 3, 0], materials.dark);
  for (let i = 0; i < 4; i++) {
    const pivot = group(root, 'Grid fins');
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    pivot.position.set(Math.sin(a) * r, heavy ? 66 : 36, Math.cos(a) * r);
    pivot.rotation.y = a;
    fins.push(pivot);
    const grid = group(pivot, 'Grid fins'),
      w = heavy ? 3.8 : 1.55,
      d = heavy ? 3.3 : 1.5;
    // Grid surface lies perpendicular to local radial direction, on a hinge.
    for (let j = 0; j <= 8; j++) {
      box(grid, [w, 0.12, 0.045], [0, 0, 0.35 + (j * d) / 8], materials.dark);
      box(
        grid,
        [0.065, 0.12, d],
        [-w / 2 + (j * w) / 8, 0, 0.35 + d / 2],
        materials.dark,
      );
    }
    for (const side of [-1, 1])
      box(
        grid,
        [0.14, 0.25, d + 0.2],
        [(side * w) / 2, 0, 0.35 + d / 2],
        materials.steel,
      );
    box(grid, [w + 0.14, 0.25, 0.14], [0, 0, d + 0.42], materials.steel);
    box(grid, [w + 0.14, 0.25, 0.14], [0, 0, 0.3], materials.steel);
    const hinge = cylinder(grid, 0.18, w, [0, 0, 0.12], materials.steel);
    hinge.rotation.z = Math.PI / 2;
    mergeStatic(grid);
  }
  if (!heavy)
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4,
        pivot = group(root, 'Landing legs');
      pivot.position.set(
        Math.sin(a) * r,
        legGeometry.hingeHeight,
        Math.cos(a) * r,
      );
      pivot.rotation.order = 'YXZ';
      pivot.rotation.y = a;
      legs.push(pivot);
      const shape = new T.Shape();
      shape.moveTo(-0.68, 0);
      shape.lineTo(0.68, 0);
      shape.lineTo(0.78, -1.2);
      shape.lineTo(0.32, -legGeometry.length);
      shape.lineTo(-0.32, -legGeometry.length);
      shape.lineTo(-0.78, -1.2);
      shape.closePath();
      mesh(
        pivot,
        new T.ExtrudeGeometry(shape, {
          depth: 0.23,
          bevelEnabled: true,
          bevelSize: 0.08,
          bevelThickness: 0.07,
          bevelSegments: 2,
          steps: 1,
        }),
        materials.white,
        [0, 0, -0.23],
      );
      const foot = group(pivot, 'Landing leg foot');
      foot.position.set(0, -legGeometry.length, 0);
      box(foot, [1.5, 0.36, 1.25], [0, 0, 0], materials.black);
      pivot.userData.foot = foot;
      const brace = group(root, 'Landing leg telescopic brace');
      const outer = cylinder(brace, 0.18, 1, [0, 0, 0], materials.dark),
        inner = cylinder(brace, 0.095, 1, [0, 0, 0], materials.steel);
      pivot.userData.brace = {
        outer,
        inner,
        anchor: new T.Vector3(
          Math.sin(a) * (r + 0.14),
          6.5,
          Math.cos(a) * (r + 0.14),
        ),
      };
      mergeStatic(pivot);
    }
  root.userData.vehicle = vehicle;
  root.userData.legFootLocal = [0, -legGeometry.length, 0];
  if (!heavy) {
    const skirt = mesh(
      skin,
      new T.CylinderGeometry(r, r, 1.8, 64, 1, true),
      materials.dark,
      [0, 2.1, 0],
    );
    skirt.userData.part = 'Engine heat shield';
  }
  const plume = group(root, 'Engine exhaust');
  const flameMat = new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: T.DoubleSide,
    blending: T.AdditiveBlending,
    uniforms: {
      time: { value: 0 },
      power: { value: 1 },
      blue: { value: heavy ? 1 : 0 },
    },
    vertexShader:
      'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:
      'varying vec2 vUv;uniform float time;uniform float power;uniform float blue;\nvoid main(){float taper=1.-vUv.y*.65;float radius=abs(vUv.x-.5)*2./taper;float edge=exp(-radius*radius*4.5);float fade=pow(1.-vUv.y,1.4);float diamond=.66+.34*pow(.5+.5*cos(vUv.y*76.-time*7.),3.);float shimmer=.88+.12*sin(time*41.+vUv.y*120.);vec3 hot=mix(vec3(1.,.24,.025),vec3(.12,.38,1.),blue);vec3 color=mix(hot,vec3(1.,.88,.62),exp(-radius*radius*25.)*(1.-vUv.y)*.65);gl_FragColor=vec4(color,edge*fade*diamond*shimmer*power*.68);}',
  });
  const active = heavy
    ? [
        [0, 0],
        [0.72, 0.4],
        [-0.72, 0.4],
      ]
    : [[0, 0]];
  for (const [x, z] of active)
    for (let a = 0; a < 3; a++) {
      const cone = mesh(
        plume,
        new T.PlaneGeometry(heavy ? 3.2 : 1.9, heavy ? 20 : 14, 1, 16),
        flameMat,
        [x, heavy ? -10 : -7, z],
      );
      cone.rotation.y = (a * Math.PI) / 3;
      cone.geometry.rotateX(Math.PI);
      cone.castShadow = false;
    }
  const engineGlow = new T.PointLight('#ffbb6b', 0, 80, 1.5);
  engineGlow.position.y = -2;
  root.add(engineGlow);
  return { root, skin, engines, fins, legs, plume, flameMat, engineGlow, r, h };
}
export function poseRocket(
  rocket: Rocket,
  deploy: number,
  fin: number,
  gimbal: number,
  power: number,
  time: number,
  explode: number,
) {
  rocket.fins.forEach((f) => {
    f.rotation.z = fin;
  });
  rocket.legs.forEach((l) => {
    l.rotation.x = legPitch(deploy);
    (l.userData.foot as T.Group).rotation.x =
      T.MathUtils.lerp(
        Math.PI * 1.5 + 0.025,
        Math.PI * 2,
        T.MathUtils.smoothstep(deploy, 0, 1),
      ) - l.rotation.x;
    l.updateMatrix();
    const brace = l.userData.brace as {
      outer: T.Mesh;
      inner: T.Mesh;
      anchor: T.Vector3;
    };
    const end = new T.Vector3(0, -legGeometry.length * 0.9, -0.27).applyMatrix4(
        l.matrix,
      ),
      direction = end.clone().sub(brace.anchor),
      length = direction.length(),
      axis = direction.normalize();
    for (const [part, start, finish] of [
      [brace.outer, 0, 0.57],
      [brace.inner, 0.52, 1],
    ] as const) {
      part.position
        .copy(brace.anchor)
        .addScaledVector(axis, (length * (start + finish)) / 2);
      part.scale.y = length * (finish - start);
      part.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), axis);
    }
  });
  rocket.engines.rotation.z = gimbal;
  rocket.engines.position.y = 3 - explode * 6;
  rocket.plume.rotation.z = gimbal;
  rocket.plume.position.set(
    3 * Math.sin(gimbal),
    3 - explode * 6 - 3 * Math.cos(gimbal),
    0,
  );
  rocket.plume.visible = power > 0.001;
  rocket.plume.scale.y = 0.65 + power * 0.6;
  rocket.flameMat.uniforms.time.value = time;
  rocket.flameMat.uniforms.power.value = Math.sqrt(power);
  rocket.engineGlow.intensity = power * 90;
  rocket.skin.position.y = explode * 10;
}
export function createShip() {
  const root = new T.Group();
  box(root, [52, 4, 88], [0, -2, 0], materials.dark);
  box(root, [53, 0.3, 89], [0, 0.12, 0], materials.deck);
  const deck = group(root, 'Drone ship');
  const paint = new T.MeshStandardMaterial({
    color: '#c8b682',
    roughness: 0.94,
    metalness: 0,
  });
  const ringMesh = mesh(
    deck,
    new T.RingGeometry(14.78, 15.14, 128),
    paint,
    [0, 0.28, 0],
    [-Math.PI / 2, 0, 0],
  );
  ringMesh.castShadow = false;
  for (const x of [-1, 1]) box(deck, [0.4, 0.025, 28], [x * 5, 0.28, 0], paint);
  box(deck, [10, 0.025, 0.4], [0, 0.28, 0], paint);
  for (let x = -24; x <= 24; x += 4)
    for (const z of [-43, 43]) {
      cylinder(deck, 0.08, 1.2, [x, 0.8, z], materials.rail);
    }
  for (const x of [-26, 26]) {
    link(
      deck,
      new T.Vector3(x, 1.3, -43),
      new T.Vector3(x, 1.3, 43),
      0.08,
      materials.rail,
    );
    for (let z = -42; z < 43; z += 5)
      cylinder(deck, 0.08, 1.2, [x, 0.8, z], materials.rail);
  }
  for (const z of [-35, 35])
    for (const x of [-18, 18]) {
      box(deck, [8, 4, 5], [x, 2.3, z], materials.white);
      box(deck, [8.1, 0.2, 5.1], [x, 4.4, z], materials.rail);
    }
  for (const z of [-28, 28])
    for (const x of [-21, 21]) {
      cylinder(deck, 1.5, 1.4, [x, 1, z], materials.dark);
      cylinder(deck, 0.15, 5, [x, 4, z], materials.rail);
    }
  mergeStatic(deck);
  return root;
}
export function createTower() {
  const root = new T.Group(),
    structure = group(root, 'Launch tower');
  const tx = -24,
    w = 6.2,
    height = 142;
  box(structure, [58, 3, 60], [tx, -0.6, 0], materials.concrete);
  for (const x of [-w, w])
    for (const z of [-w, w])
      box(
        structure,
        [1.1, height, 1.1],
        [tx + x, height / 2, z],
        materials.dark,
      );
  for (let y = 8; y < height; y += 10) {
    for (const z of [-w, w]) {
      box(structure, [w * 2 + 1, 0.65, 0.7], [tx, y, z], materials.rail);
      link(
        structure,
        new T.Vector3(tx - w, y - 9, z),
        new T.Vector3(tx + w, y, z),
        0.22,
        materials.rail,
      );
      link(
        structure,
        new T.Vector3(tx + w, y - 9, z),
        new T.Vector3(tx - w, y, z),
        0.22,
        materials.rail,
      );
    }
    for (const x of [-w, w]) {
      box(structure, [0.7, 0.65, w * 2 + 1], [tx + x, y, 0], materials.rail);
      link(
        structure,
        new T.Vector3(tx + x, y - 9, -w),
        new T.Vector3(tx + x, y, w),
        0.22,
        materials.rail,
      );
      link(
        structure,
        new T.Vector3(tx + x, y - 9, w),
        new T.Vector3(tx + x, y, -w),
        0.22,
        materials.rail,
      );
    }
    box(structure, [10, 0.3, 10], [tx, y, 0], materials.dark);
  }
  for (const z of [-4, 4])
    box(
      structure,
      [0.55, height, 1],
      [tx + w + 0.8, height / 2, z],
      materials.steel,
    );
  box(structure, [18, 2, 18], [tx, height, 0], materials.dark);
  cylinder(structure, 0.32, 10, [tx, height + 5, 0], materials.rail);
  const crane = box(
    structure,
    [36, 1.3, 2],
    [tx + 6, height + 2, 0],
    materials.orange,
  );
  crane.rotation.z = 0.12;
  for (const z of [-4, 4])
    link(
      structure,
      new T.Vector3(tx + 7, height, z),
      new T.Vector3(tx + 7, 72, z),
      0.065,
      materials.black,
    );
  // Service buildings, tanks and pipes kept below the recovery envelope.

  mergeStatic(structure);
  const carriage = group(root, 'Catch carriage');
  carriage.position.set(tx, 76, 0);
  box(carriage, [4, 9, 16], [7, -3, 0], materials.dark);
  const arms: T.Group[] = [];
  for (const side of [-1, 1]) {
    const arm = group(carriage, 'Catch arms');
    arm.position.set(8, 0, side * 4.75);
    arms.push(arm);
    box(arm, [24, 1.6, 1.15], [12, -1.1, 0], materials.dark);
    box(arm, [24, 0.25, 1.65], [12, -0.18, 0], materials.orange);
    for (let x = 0; x < 24; x += 3) {
      link(
        arm,
        new T.Vector3(x, -3.5, 0),
        new T.Vector3(x + 3, -0.5, 0),
        0.15,
        materials.rail,
      );
      link(
        arm,
        new T.Vector3(x, -0.5, 0),
        new T.Vector3(x + 3, -3.5, 0),
        0.15,
        materials.rail,
      );
    }
    box(arm, [24, 0.45, 0.6], [12, -3.5, 0], materials.dark);
    for (let x = 0; x <= 24; x += 3)
      cylinder(arm, 0.075, 1, [x, 0.7, side * 0.9], materials.rail);
    link(
      arm,
      new T.Vector3(0, 1.1, side * 0.9),
      new T.Vector3(24, 1.1, side * 0.9),
      0.075,
      materials.rail,
    );
    mergeStatic(arm);
  }
  return { root, carriage, arms };
}
