import * as T from 'three';
import { box, cylinder, link, materials, mergeStatic } from './model';

function surfaceTexture(base: string, seed = 733) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 22000; i++) {
    seed = (seed * 16807) % 2147483647;
    const x = seed % 512;
    seed = (seed * 16807) % 2147483647;
    const y = seed % 512;
    ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.065)';
    ctx.fillRect(x, y, 1 + (i % 3), 1);
  }
  ctx.strokeStyle = 'rgba(18,25,29,.17)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 512; i += 128) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.anisotropy = 8;
  return texture;
}
export function createStarbase(loader: T.TextureLoader) {
  const root = new T.Group();
  // USGS NAIP: a real Boca Chica coastline, registered around the original launch area.
  // Historical imagery is geographic context; foreground hardware is an educational reconstruction.
  const texture = loader.load('/textures/rocket-recovery/starbase-aerial.jpg');
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 16;
  const terrain = new T.Mesh(
    new T.PlaneGeometry(3955, 3955),
    new T.MeshStandardMaterial({
      map: texture,
      color: '#b8c2be',
      roughness: 1,
      metalness: 0,
    }),
  );
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.y = -1.05;
  terrain.receiveShadow = true;
  root.add(terrain);
  const concreteMap = surfaceTexture('#6b6c66'),
    concrete = new T.MeshStandardMaterial({
      map: concreteMap,
      roughness: 0.94,
      color: '#bdc2be',
    });
  const paving = box(root, [156, 0.45, 112], [-27, -0.72, -2], concrete);
  paving.receiveShadow = true;
  const roadMat = new T.MeshStandardMaterial({
    map: surfaceTexture('#333936', 951),
    roughness: 0.95,
  });
  box(root, [680, 0.2, 16], [-330, -0.7, -62], roadMat);
  for (let x = -650; x < 22; x += 14)
    box(root, [6, 0.014, 0.15], [x, -0.59, -62], materials.white);
  for (const z of [-68.8, -55.2])
    box(root, [680, 0.016, 0.16], [-330, -0.58, z], materials.white);
  // Pad equipment: separate service yard, tank farm, pipe bridge and orbital launch mount.
  const yard = box(root, [152, 0.2, 88], [-174, -0.85, -78], concrete);
  yard.receiveShadow = true;
  for (let i = 0; i < 5; i++) {
    const x = -222 + i * 24;
    for (const z of [-110, -83]) {
      const vessel = cylinder(root, 6.7, 22, [x, 10.5, z], materials.white);
      vessel.userData.part = 'Ground propellant storage';
      const cap = new T.Mesh(
        new T.SphereGeometry(6.7, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        materials.white,
      );
      cap.position.set(x, 21.5, z);
      cap.scale.y = 0.36;
      cap.castShadow = true;
      root.add(cap);
      for (const y of [2, 10, 19]) {
        const band = new T.Mesh(
          new T.TorusGeometry(6.72, 0.07, 5, 48),
          materials.rail,
        );
        band.rotation.x = Math.PI / 2;
        band.position.set(x, y, z);
        root.add(band);
      }
      box(root, [1, 24, 0.3], [x + 6.8, 11, z], materials.dark);
      for (let y = 0; y < 22; y += 1)
        box(root, [1, 0.08, 0.5], [x + 6.8, y, z], materials.rail);
    }
  }
  for (const z of [-90, -87, -84])
    link(
      root,
      new T.Vector3(-229, 3.4, z),
      new T.Vector3(-62, 3.4, z),
      0.28,
      materials.rail,
    );
  for (let x = -220; x < -48; x += 16) {
    box(root, [0.35, 5, 8], [x, 1.6, -87], materials.dark);
    box(root, [1.8, 0.35, 8], [x, 4, -87], materials.rail);
  }
  for (let i = 0; i < 3; i++) {
    const x = -128 - i * 36,
      z = 48;
    box(root, [27, 8, 20], [x, 3.2, z], materials.white);
    box(root, [28, 0.5, 21], [x, 7.4, z], materials.rail);
    for (let a = 0; a < 5; a++)
      box(root, [3, 2, 0.12], [x - 10 + a * 5, 4.3, z + 10.06], materials.dark);
    for (let a = 0; a < 3; a++)
      box(root, [3, 1.2, 3], [x - 7 + a * 7, 8.2, z], materials.dark);
  }
  const launch = new T.Group();
  launch.position.set(35, 0, -33);
  root.add(launch);
  const mount = new T.Mesh(
    new T.TorusGeometry(7.2, 1.15, 12, 64),
    materials.dark,
  );
  mount.rotation.x = Math.PI / 2;
  mount.position.y = 12;
  mount.castShadow = true;
  launch.add(mount);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    link(
      launch,
      new T.Vector3(Math.cos(a) * 9.8, 0, Math.sin(a) * 9.8),
      new T.Vector3(Math.cos(a) * 7, 12, Math.sin(a) * 7),
      0.82,
      materials.dark,
    );
  }
  const plate = cylinder(launch, 8.7, 0.4, [0, 0.1, 0], materials.steel);
  plate.userData.part = 'Launch mount';
  for (const x of [-46, 46])
    for (let z = -43; z <= 39; z += 18) {
      cylinder(root, 0.11, 18, [x, 8, z], materials.rail);
      box(root, [2.2, 0.5, 0.6], [x, 17, z], materials.white);
    }
  // Sparse scrub and dune patches around the pavement add true surface relief.
  const scrubMat = new T.MeshStandardMaterial({
    color: '#646647',
    roughness: 1,
  });
  const bushGeo = new T.IcosahedronGeometry(1, 1);
  for (let i = 0; i < 110; i++) {
    const a = i * 2.3999632,
      r = 110 + (i % 17) * 10;
    const x = Math.cos(a) * r - 30,
      z = Math.sin(a) * r;
    if ((z < -48 && z > -127) || (x < -74 && z < 90 && z > 0)) continue;
    const shrub = new T.Mesh(bushGeo, scrubMat);
    shrub.position.set(x, -0.3, z);
    shrub.scale.set(1.5 + (i % 4), 0.7 + (i % 3) * 0.35, 1.2 + (i % 3));
    root.add(shrub);
  }
  mergeStatic(root);
  return root;
}
export function createEarth(loader: T.TextureLoader) {
  const root = new T.Group(),
    radius = 68;
  const day = loader.load('/textures/starlink/earth-day.jpg');
  day.colorSpace = T.SRGBColorSpace;
  day.anisotropy = 8;
  const night = loader.load('/textures/starlink/earth-night.jpg');
  night.colorSpace = T.SRGBColorSpace;
  const globe = new T.Mesh(
    new T.SphereGeometry(radius, 128, 64),
    new T.MeshStandardMaterial({
      map: day,
      roughness: 0.88,
      metalness: 0,
      emissiveMap: night,
      emissive: '#7894b1',
      emissiveIntensity: 0.12,
    }),
  );
  root.add(globe);
  const cloudsTexture = loader.load('/textures/starlink/earth-clouds.jpg');
  const clouds = new T.Mesh(
    new T.SphereGeometry(radius + 0.32, 128, 64),
    new T.MeshStandardMaterial({
      color: '#f8fcff',
      alphaMap: cloudsTexture,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      roughness: 1,
    }),
  );
  root.add(clouds);
  const atmosphere = new T.Mesh(
    new T.SphereGeometry(radius * 1.045, 96, 48),
    new T.ShaderMaterial({
      side: T.BackSide,
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      vertexShader:
        'varying vec3 n;varying vec3 v;void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',
      fragmentShader:
        'varying vec3 n;varying vec3 v;void main(){float rim=pow(max(0.,1.-abs(dot(normalize(n),normalize(v)))),3.);gl_FragColor=vec4(.13,.43,.85,rim*.58);}',
    }),
  );
  root.add(atmosphere);
  const geo = (lat: number, lon: number, r = radius) =>
    new T.Vector3(
      r * Math.cos((lat * Math.PI) / 180) * Math.cos((lon * Math.PI) / 180),
      r * Math.sin((lat * Math.PI) / 180),
      -r * Math.cos((lat * Math.PI) / 180) * Math.sin((lon * Math.PI) / 180),
    );
  const starbase = geo(25.997, -97.157, radius + 0.6),
    atlantic = geo(29, -75, radius + 0.6);
  for (const [point, color] of [
    [starbase, '#e3f28b'],
    [atlantic, '#77d5ff'],
  ] as const) {
    const dot = new T.Mesh(
      new T.SphereGeometry(0.65, 20, 12),
      new T.MeshBasicMaterial({ color }),
    );
    dot.position.copy(point);
    root.add(dot);
    const ring = new T.Mesh(
      new T.TorusGeometry(1.35, 0.09, 8, 48),
      new T.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 }),
    );
    ring.position.copy(point);
    ring.lookAt(point.clone().multiplyScalar(2));
    root.add(ring);
  }
  const positions = new Float32Array(1700 * 3);
  let seed = 772;
  for (let i = 0; i < 1700; i++) {
    seed = (seed * 16807) % 2147483647;
    const theta = (seed / 2147483647) * Math.PI * 2;
    seed = (seed * 16807) % 2147483647;
    const y = (seed / 2147483647) * 2 - 1,
      s = Math.sqrt(1 - y * y);
    positions.set(
      [Math.cos(theta) * s * 1800, y * 1800, Math.sin(theta) * s * 1800],
      i * 3,
    );
  }
  const starsGeo = new T.BufferGeometry();
  starsGeo.setAttribute('position', new T.BufferAttribute(positions, 3));
  const stars = new T.Points(
    starsGeo,
    new T.PointsMaterial({
      color: '#bdcbdc',
      size: 1.6,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
    }),
  );
  root.add(stars);
  return { root, clouds, starbase, atlantic };
}
