import * as THREE from 'three';
import type { ModelKit, P3 } from './vehicle-model';
import { bodyOutline } from './body-surface';

// Contours reconstructed from the Corolla front-suspension exploded diagram.
// Source and fitment limits are recorded in docs/corolla-reference-register.md.
export function detailFrontSuspension(
  k: ModelKit,
  root: THREE.Group,
  arm: THREE.Group,
  knuckle: THREE.Group,
  side: number,
) {
  const { mesh, bar, steel, alloy, rubber, black } = k;
  const label = side < 0 ? 'Left' : 'Right',
    s = side < 0 ? 'left' : 'right';
  const part = (id: string, name: string, offset: P3, description: string) =>
    k.part(root, {
      id: `car-front-${s}-${id}`,
      name: `${label} front ${name}`,
      system: 'suspension',
      offset,
      stage: 4,
      description,
      material: 'Steel and elastomer',
    });
  function casting(
    parent: THREE.Group,
    shape: THREE.Shape,
    depth: number,
    sample: (a: number, b: number, d: number) => P3,
    material: THREE.Material,
    bevel = 0.003,
  ) {
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: bevel,
      bevelThickness: bevel,
      curveSegments: 32,
    });
    const pos = geometry.getAttribute('position');
    for (let i = 0; i < pos.count; i++)
      pos.setXYZ(i, ...sample(pos.getX(i), pos.getY(i), pos.getZ(i)));
    // Mapping the profile into X/Z swaps axes; restore outward winding on
    // the mirrored side before computing normals for the closed cast surface.
    if (side > 0) {
      for (let i = 0; i < pos.count; i += 3) {
        const a = [pos.getX(i + 1), pos.getY(i + 1), pos.getZ(i + 1)] as P3;
        pos.setXYZ(i + 1, pos.getX(i + 2), pos.getY(i + 2), pos.getZ(i + 2));
        pos.setXYZ(i + 2, ...a);
      }
    }
    geometry.computeVertexNormals();
    return mesh(parent, geometry, material);
  }
  function hole(shape: THREE.Shape, x: number, y: number, r: number) {
    const path = new THREE.Path();
    path.absarc(x, y, r, 0, Math.PI * 2, true);
    shape.holes.push(path);
  }
  const armShape = bodyOutline([
    [0.401, -0.22],
    [0.464, -0.231],
    [0.502, -0.123],
    [0.656, -0.05],
    [0.738, -0.038],
    [0.749, 0.034],
    [0.696, 0.062],
    [0.641, 0.059],
    [0.529, 0.131],
    [0.515, 0.284],
    [0.487, 0.331],
    [0.416, 0.331],
    [0.392, 0.285],
    [0.415, 0.039],
    [0.408, -0.124],
  ]);
  const voidShape = new THREE.Path();
  voidShape.moveTo(0.468, -0.064);
  voidShape.quadraticCurveTo(0.49, -0.067, 0.558, 0.004);
  voidShape.quadraticCurveTo(0.548, 0.034, 0.48, 0.097);
  voidShape.quadraticCurveTo(0.462, 0.056, 0.468, -0.064);
  voidShape.closePath();
  armShape.holes.push(voidShape);
  hole(armShape, 0.465, 0.218, 0.014);
  hole(armShape, 0.688, -0.009, 0.008);
  hole(armShape, 0.711, 0.032, 0.008);
  casting(
    arm,
    armShape,
    0.013,
    (x, z, d) => [side * x, 0.183 + (x - 0.43) * 0.083 + d, z],
    black,
    0.004,
  );
  // Raised ribs follow the two pressed webs rather than a triangular tube frame.
  for (const points of [
    [
      [0.437, -0.186],
      [0.469, -0.103],
      [0.544, -0.052],
      [0.647, -0.011],
    ],
    [
      [0.458, 0.285],
      [0.478, 0.17],
      [0.506, 0.112],
      [0.619, 0.05],
    ],
  ])
    k.tube(
      arm,
      points.map(([x, z]): P3 => [side * x, 0.204 + (x - 0.43) * 0.083, z]),
      0.0045,
      steel,
    );
  for (const [where, x, z, axis] of [
    ['forward', 0.436, -0.205, 'z'],
    ['rear', 0.453, 0.286, 'y'],
  ] as const) {
    const bush = part(
      `${where}-arm-bushing`,
      `${where} control-arm bushing`,
      [side * 0.66, -0.49, where === 'rear' ? 0.3 : -0.3],
      'A bonded rubber bushing and steel sleeve isolate road vibration while locating the lower arm on the suspension cradle. The two bushings have different axes.',
    );
    const cy = 0.197;
    const outer = mesh(
      bush,
      new THREE.CylinderGeometry(0.033, 0.033, 0.061, 40),
      steel,
      [side * x, cy, z],
    );
    const rubberCore = mesh(
      bush,
      new THREE.CylinderGeometry(0.027, 0.027, 0.065, 40),
      rubber,
      [side * x, cy, z],
    );
    const sleeve = mesh(
      bush,
      new THREE.CylinderGeometry(0.01, 0.01, 0.07, 32),
      alloy,
      [side * x, cy, z],
    );
    for (const object of [outer, rubberCore, sleeve])
      if (axis === 'z') object.rotation.x = Math.PI / 2;
    const a: P3 = [
      side * x,
      cy - (axis === 'y' ? 0.047 : 0),
      z - (axis === 'z' ? 0.047 : 0),
    ];
    const b: P3 = [
      side * x,
      cy + (axis === 'y' ? 0.047 : 0),
      z + (axis === 'z' ? 0.047 : 0),
    ];
    bar(bush, a, b, 0.006, alloy);
    const bolt = mesh(
      bush,
      new THREE.CylinderGeometry(0.011, 0.011, 0.008, 6),
      alloy,
      b,
    );
    if (axis === 'z') bolt.rotation.x = Math.PI / 2;
  }
  const joint = part(
    'ball-joint',
    'lower ball joint',
    [side * 0.83, -0.24, -0.19],
    'The separately bolted lower ball joint connects the stamped control arm to the steering knuckle. Its tapered stud and protected spherical joint allow the wheel to steer and move vertically.',
  );
  const flange = bodyOutline([
    [-0.045, -0.028],
    [0.035, -0.029],
    [0.044, 0.014],
    [0.011, 0.035],
    [-0.035, 0.029],
  ]);
  for (const [x, z] of [
    [-0.031, -0.016],
    [0.025, -0.014],
    [0.003, 0.022],
  ])
    hole(flange, x, z, 0.005);
  casting(
    joint,
    flange,
    0.009,
    (x, z, d) => [side * (0.704 + x), 0.211 + d, z],
    steel,
    0.002,
  );
  mesh(joint, new THREE.CylinderGeometry(0.024, 0.026, 0.022, 40), steel, [
    side * 0.706,
    0.222,
    0,
  ]);
  mesh(joint, new THREE.SphereGeometry(0.023, 24, 16), rubber, [
    side * 0.706,
    0.242,
    0,
  ]).scale.set(1, 0.63, 1);
  bar(joint, [side * 0.706, 0.24, 0], [side * 0.706, 0.283, 0], 0.008, alloy);
  mesh(joint, new THREE.CylinderGeometry(0.014, 0.014, 0.012, 6), alloy, [
    side * 0.706,
    0.283,
    0,
  ]);
  // Cast knuckle: hub bore, two strut ears, steering arm and ball-joint socket.
  const upright = bodyOutline([
    [-0.022, 0.5],
    [0.024, 0.5],
    [0.032, 0.463],
    [0.031, 0.426],
    [0.047, 0.385],
    [0.058, 0.35],
    [0.052, 0.319],
    [0.125, 0.31],
    [0.139, 0.292],
    [0.117, 0.274],
    [0.059, 0.291],
    [0.025, 0.262],
    [-0.032, 0.251],
    [-0.048, 0.268],
    [-0.042, 0.29],
    [-0.057, 0.311],
    [-0.06, 0.349],
    [-0.047, 0.381],
    [-0.032, 0.417],
    [-0.031, 0.477],
  ]);
  hole(upright, 0, 0.325, 0.046);
  hole(upright, 0, 0.473, 0.007);
  hole(upright, 0, 0.43, 0.007);
  hole(upright, 0.117, 0.296, 0.007);
  casting(
    knuckle,
    upright,
    0.034,
    (z, y, d) => [side * (0.692 + d - Math.max(0, y - 0.325) * 0.3), y, z],
    steel,
    0.003,
  );
  for (const faceX of [0.693, 0.727]) {
    const lip = mesh(
      knuckle,
      new THREE.TorusGeometry(0.048, 0.004, 10, 64),
      alloy,
      [side * faceX, 0.325, 0],
    );
    lip.rotation.y = Math.PI / 2;
  }
  for (const y of [0.43, 0.473]) {
    const x = 0.707 - (y - 0.325) * 0.3;
    bar(
      knuckle,
      [side * (x - 0.034), y, 0],
      [side * (x + 0.034), y, 0],
      0.0065,
      alloy,
    );
    const bolt = mesh(
      knuckle,
      new THREE.CylinderGeometry(0.012, 0.012, 0.009, 6),
      alloy,
      [side * (x + 0.038), y, 0],
    );
    bolt.rotation.z = Math.PI / 2;
  }
  // Machined bearing seat is visibly hollow when the drive shaft is removed.
  const bearing = part(
    'hub-bearing',
    'hub bearing',
    [side * 0.94, 0.03, 0.15],
    'The double-row wheel bearing fits in the knuckle bore and supports the rotating drive hub. A central opening admits the splined outer drive-shaft stub.',
  );
  const section = [
    new THREE.Vector2(0.03, 0),
    new THREE.Vector2(0.044, 0),
    new THREE.Vector2(0.044, 0.034),
    new THREE.Vector2(0.03, 0.034),
    new THREE.Vector2(0.03, 0),
  ];
  const bearingMesh = mesh(
    bearing,
    new THREE.LatheGeometry(section, 64),
    alloy,
    [side * 0.697, 0.325, 0],
  );
  bearingMesh.rotation.z = (-side * Math.PI) / 2;
  for (const x of [0.699, 0.729]) {
    const seal = mesh(
      bearing,
      new THREE.TorusGeometry(0.036, 0.004, 8, 48),
      rubber,
      [side * x, 0.325, 0],
    );
    seal.rotation.y = Math.PI / 2;
  }
}
