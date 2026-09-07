import * as THREE from 'three';
import { vehiclePart, type VehicleAssembly } from './vehicle-assemblies';
import { corollaWheelCoverGeometry } from './corolla-wheel-cover';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  TIRE_RADIUS,
  VEHICLE_DIMENSIONS as D,
} from '../../lib/engine/vehicle-dimensions';

// Local Z is the axle. The caliper stays fixed as the tire, rim and disc turn.
export function createRoadWheel(
  prefix = 'wheel',
  label = 'Wheel',
  rear = false,
) {
  const rimScale = D.rimDiameter / (17 * 0.0254);
  const brakeRadius = (rear ? D.rearBrakeDiameter : D.frontBrakeDiameter) / 2;
  const brakeScale = brakeRadius / (rear ? 0.135 : 0.15);
  const sidewallRadius = (r: number) =>
    THREE.MathUtils.mapLinear(
      r,
      0.208,
      0.309,
      0.208 * rimScale,
      TIRE_RADIUS - 0.00815,
    );
  const group = new THREE.Group(),
    spin = new THREE.Group();
  const parts: VehicleAssembly[] = [];
  const part = (
    id: string,
    name: string,
    offset: [number, number, number],
    stage: number,
    description: string,
    parent: THREE.Group = spin,
  ) =>
    vehiclePart(
      parent,
      {
        id: `car-${prefix}-${id}`,
        name: `${label} ${name}`,
        system: 'brakes',
        offset,
        stage,
        description,
        material: 'Rubber, steel and polymer',
      },
      parts,
    );
  const tireGroup = part(
    'tire',
    'tire',
    [0, 0, 0.85],
    2,
    '205/55 R16 tire with a shaped sidewall and grooved tread.',
  );
  const rimGroup = part(
    'rim',
    'steel wheel',
    [0, 0, 0.5],
    3,
    'The pressed steel wheel supports the tire beads.',
  );
  const coverGroup = part(
    'cover',
    'wheel cover',
    [0, 0, 1.18],
    0,
    'An eight-spoke silver polymer cover clips over the steel wheel. Its broad faceted spokes and recessed lug openings follow the photographed Corolla LE cover.',
  );
  const discGroup = part(
    'disc',
    rear ? 'solid brake disc' : 'ventilated brake disc',
    [0, 0, 0.29],
    4,
    rear
      ? 'The rear solid disc provides a friction surface for braking.'
      : 'Two friction faces and cooling vanes form the ventilated front brake disc.',
  );
  const fasteners = part(
    'nuts',
    'wheel nuts',
    [0, 0, 1.4],
    0,
    'Five wheel nuts clamp the wheel to the hub.',
  );
  const caliperGroup = part(
    'caliper',
    'brake caliper',
    [-0.18, 0.18, 0.28],
    3,
    'The caliper stays with the suspension while the disc rotates. Its hydraulic piston presses the pads against both disc faces.',
    group,
  );
  let current = tireGroup;
  spin.name = 'wheel-rotor';
  group.add(spin);
  group.scale.z = D.tireWidth / 0.225;
  const rubber = new THREE.MeshStandardMaterial({
    color: '#141619',
    roughness: 0.88,
    metalness: 0,
  });
  const treadRubber = new THREE.MeshStandardMaterial({
    color: '#111315',
    roughness: 0.94,
    metalness: 0,
  });
  const alloy = new THREE.MeshStandardMaterial({
    color: '#a3aab0',
    roughness: 0.3,
    metalness: 0.65,
  });
  const polished = new THREE.MeshStandardMaterial({
    color: '#d3d9dd',
    roughness: 0.19,
    metalness: 1,
  });
  const graphite = new THREE.MeshStandardMaterial({
    color: '#333940',
    roughness: 0.38,
    metalness: 0.75,
  });
  const rotorSteel = new THREE.MeshStandardMaterial({
    color: '#737b82',
    roughness: 0.43,
    metalness: 0.9,
  });
  const coverMaterial = new THREE.MeshPhysicalMaterial({
    color: '#abb0b3',
    metalness: 0.28,
    roughness: 0.36,
    clearcoat: 0.42,
    clearcoatRoughness: 0.25,
  });
  const materials = [
    coverMaterial,
    rubber,
    treadRubber,
    alloy,
    polished,
    graphite,
    rotorSteel,
  ];
  const grainData = new Uint8Array(128 * 128 * 4);
  let seed = 1731;
  for (let i = 0; i < grainData.length; i += 4) {
    seed = (1664525 * seed + 1013904223) >>> 0;
    grainData[i] = grainData[i + 1] = grainData[i + 2] = 215 + (seed % 40);
    grainData[i + 3] = 255;
  }
  const grain = new THREE.DataTexture(grainData, 128, 128);
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.repeat.set(12, 3);
  grain.needsUpdate = true;
  for (const material of [rubber, treadRubber]) {
    material.bumpMap = grain;
    material.bumpScale = 0.00012;
    material.roughnessMap = grain;
  }
  function mesh(
    geometry: THREE.BufferGeometry,
    material: THREE.MeshStandardMaterial,
    z = 0,
    parent = current,
  ) {
    const m = new THREE.Mesh(geometry, material);
    m.position.z = z;
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function lathe(profile: number[][], material: THREE.MeshStandardMaterial) {
    const geometry = new THREE.LatheGeometry(
      profile.map(
        ([r, z]) =>
          new THREE.Vector2(
            material === rubber ? sidewallRadius(r) : r * rimScale,
            z,
          ),
      ),
      96,
    );
    geometry.rotateX(Math.PI / 2);
    return mesh(geometry, material);
  }
  function ring(radius: number, tube: number, z: number, material = polished) {
    return mesh(new THREE.TorusGeometry(radius, tube, 8, 96), material, z);
  }
  function disk(
    radius: number,
    depth: number,
    z: number,
    material: THREE.MeshStandardMaterial,
    segments = 64,
  ) {
    const g = new THREE.CylinderGeometry(radius, radius, depth, segments);
    g.rotateX(Math.PI / 2);
    return mesh(g, material, z);
  }
  // Flattened crown with curved sidewalls, not a torus-shaped tire.
  const carcass = lathe(
    [
      [0.208, -0.09],
      [0.218, -0.102],
      [0.24, -0.111],
      [0.276, -0.1125],
      [0.299, -0.101],
      [0.309, -0.087],
      [0.309, 0.087],
      [0.299, 0.101],
      [0.276, 0.1125],
      [0.24, 0.111],
      [0.218, 0.102],
      [0.208, 0.09],
      [0.208, -0.09],
    ],
    rubber,
  );
  carcass.name = 'tire-carcass';
  // Recess four longitudinal channels and swept lateral grooves into the crown.
  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  const radialSteps = 512,
    widthSteps = 72,
    crownWidth = 0.174;
  for (let i = 0; i <= radialSteps; i++) {
    const angle = (i / radialSteps) * Math.PI * 2;
    for (let j = 0; j <= widthSteps; j++) {
      const z = (j / widthSteps - 0.5) * crownWidth;
      let radius =
        TIRE_RADIUS - 0.005 * Math.pow(Math.abs(z) / (0.5 * crownWidth), 6);
      for (const channel of [-0.057, -0.019, 0.019, 0.057])
        radius -=
          0.006 *
          (1 -
            THREE.MathUtils.smoothstep(Math.abs(z - channel), 0.0018, 0.0042));
      const phase =
        ((i / radialSteps) * 64 + Math.abs(z) * 22 + (z < 0 ? 0.5 : 0)) % 1;
      radius -=
        0.0045 *
        (1 -
          THREE.MathUtils.smoothstep(Math.min(phase, 1 - phase), 0.025, 0.1));
      positions.push(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
      uvs.push(i / radialSteps, j / widthSteps);
      if (i < radialSteps && j < widthSteps) {
        const a = i * (widthSteps + 1) + j,
          b = a + widthSteps + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const tread = new THREE.BufferGeometry();
  tread.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  );
  tread.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  tread.setIndex(indices);
  tread.computeVertexNormals();
  mesh(tread, treadRubber);
  for (const side of [-1, 1]) {
    ring(sidewallRadius(0.222), 0.0015, side * 0.106, rubber);
    ring(sidewallRadius(0.279), 0.0012, side * 0.112, rubber);
    ring(sidewallRadius(0.294), 0.0012, side * 0.105, rubber);
    current = rimGroup;
    ring(D.rimDiameter / 2, 0.0045, side * 0.092);
    current = tireGroup;
  }
  current = rimGroup;
  lathe(
    [
      [0.213, -0.095],
      [0.216, -0.085],
      [0.202, -0.065],
      [0.199, 0.067],
      [0.213, 0.088],
      [0.216, 0.095],
    ],
    graphite,
  );
  ring(0.204 * rimScale, 0.003, 0.092);
  const pressedFace = new THREE.Shape();
  pressedFace.absarc(0, 0, 0.184, 0, Math.PI * 2, false);
  const centerHole = new THREE.Path();
  centerHole.absarc(0, 0, 0.033, 0, Math.PI * 2, true);
  pressedFace.holes.push(centerHole);
  for (let j = 0; j < 10; j++) {
    const a = (j / 10) * Math.PI * 2,
      hole = new THREE.Path();
    hole.absellipse(
      Math.cos(a) * 0.128,
      Math.sin(a) * 0.128,
      0.026,
      0.034,
      0,
      Math.PI * 2,
      true,
      a,
    );
    pressedFace.holes.push(hole);
  }
  mesh(
    new THREE.ExtrudeGeometry(pressedFace, {
      depth: 0.006,
      bevelEnabled: true,
      bevelSize: 0.002,
      bevelThickness: 0.002,
      bevelSegments: 2,
      curveSegments: 16,
    }),
    graphite,
    0.062,
  );

  current = discGroup;
  disk(brakeRadius, rear ? 0.009 : 0.005, 0.053, rotorSteel);
  if (!rear) disk(brakeRadius, 0.005, 0.041, rotorSteel);
  disk(0.072, 0.032, 0.056, graphite);
  const ventGeometries: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 48; i++) {
    const g = new THREE.BoxGeometry(0.023, 0.002, 0.008),
      a = (i / 48) * Math.PI * 2;
    g.rotateZ(a);
    g.translate(Math.cos(a) * 0.153, Math.sin(a) * 0.153, 0.047);
    ventGeometries.push(g);
  }
  const vents = mergeGeometries(ventGeometries);
  ventGeometries.forEach((g) => g.dispose());
  if (vents) {
    if (!rear) {
      vents.scale(0.87 * brakeScale, 0.87 * brakeScale, 1);
      mesh(vents, graphite);
    } else vents.dispose();
  }
  ring((rear ? 0.112 : 0.131) * brakeScale, 0.00065, 0.06, graphite);
  ring((rear ? 0.127 : 0.143) * brakeScale, 0.00065, 0.06, graphite);
  current = coverGroup;
  mesh(corollaWheelCoverGeometry(D.rimDiameter / 2 - 0.006), coverMaterial);
  const coverRim = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.171, 0.081),
      new THREE.Vector2(0.177, 0.087),
      new THREE.Vector2(0.185, 0.089),
      new THREE.Vector2(0.194, 0.087),
      new THREE.Vector2(D.rimDiameter / 2 - 0.004, 0.081),
      new THREE.Vector2(0.194, 0.077),
      new THREE.Vector2(0.171, 0.077),
      new THREE.Vector2(0.171, 0.081),
    ],
    96,
  );
  coverRim.rotateX(Math.PI / 2);
  mesh(coverRim, coverMaterial);
  ring(D.rimDiameter / 2 - 0.006, 0.003, 0.083, coverMaterial);
  const coverCentre = new THREE.Shape();
  coverCentre.absarc(0, 0, 0.07, 0, Math.PI * 2, false);
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5,
      hole = new THREE.Path();
    hole.absarc(
      Math.cos(a) * 0.05,
      Math.sin(a) * 0.05,
      0.011,
      0,
      Math.PI * 2,
      true,
    );
    coverCentre.holes.push(hole);
  }
  mesh(
    new THREE.ExtrudeGeometry(coverCentre, {
      depth: 0.007,
      bevelEnabled: true,
      bevelSize: 0.002,
      bevelThickness: 0.002,
      bevelSegments: 3,
      curveSegments: 48,
    }),
    coverMaterial,
    0.09,
  );

  disk(0.029, 0.004, 0.099, coverMaterial);
  ring(0.031, 0.0008, 0.101, polished);
  for (const [r, sx, sy, y] of [
    [0.011, 1.35, 1, 0],
    [0.008, 0.46, 1, 0],
    [0.008, 1.5, 0.38, 0.0035],
  ]) {
    const logo = mesh(
      new THREE.TorusGeometry(r, 0.0009, 7, 36),
      graphite,
      0.104,
    );
    logo.scale.set(sx, sy, 1);
    logo.position.y = y;
  }
  current = fasteners;
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5,
      bolt = disk(0.0065, 0.009, 0.098, polished, 6);
    bolt.position.x = Math.cos(a) * 0.05;
    bolt.position.y = Math.sin(a) * 0.05;
  }
  current = rimGroup;
  const valve = disk(0.0035, 0.021, 0.104, rubber, 8);
  valve.position.set(0.181 * rimScale, 0, 0.104);
  valve.rotation.y = 0.2;
  const caliper = mesh(
    new RoundedBoxGeometry(0.057, 0.112, 0.051, 3, 0.009),
    graphite,
    0.046,
    caliperGroup,
  );
  caliper.position.x = (rear ? -0.125 : -0.143) * brakeScale;
  const bridge = mesh(
    new RoundedBoxGeometry(0.038, 0.071, 0.016, 2, 0.005),
    alloy,
    0.078,
    caliperGroup,
  );
  bridge.position.x = (rear ? -0.132 : -0.15) * brakeScale;
  return { group, materials, parts, textures: [grain] };
}
