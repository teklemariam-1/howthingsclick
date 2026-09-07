import * as THREE from 'three';
import type { ModelKit, P3 } from './vehicle-model';
import { bodyOutline, bodyPatch, outlineTube } from './body-surface';
import { trunkShutLine } from '../../lib/engine/corolla-panel-lines';
import type { VehicleSystem } from '../../lib/engine/vehicle-parts';

// Photo-shaped luggage trim and a mechanically plausible stamped inner body.
// Hinge/torsion-rod arrangement follows Corolla sedan parts references; hidden
// stampings are reconstructed, not Toyota manufacturing CAD.
export function createLuggageCompartment(
  k: ModelKit,
  root: THREE.Group,
  lid: THREE.Group,
  motion: THREE.Group,
  pivot: P3,
  rearFace: (x: number, y: number, offset?: number) => P3,
  deck: (u: number, v: number) => P3,
) {
  const { mesh, box, surface, tube, bar, steel, alloy, black, rubber } = k;
  const part = (
    id: string,
    name: string,
    system: VehicleSystem,
    offset: P3,
    stage: number,
    description: string,
    material: string,
    parent: THREE.Group = root,
  ) =>
    k.part(parent, {
      id: `car-${id}`,
      name,
      system,
      offset,
      stage,
      description,
      material,
    });
  const innerPaint = new THREE.MeshPhysicalMaterial({
    color: '#bcc6c4',
    metalness: 0.28,
    roughness: 0.54,
    clearcoat: 0.2,
    side: THREE.DoubleSide,
  });
  const carpet = new THREE.MeshStandardMaterial({
    color: '#303639',
    roughness: 0.96,
    side: THREE.DoubleSide,
  });
  const foam = new THREE.MeshStandardMaterial({
    color: '#242a2d',
    roughness: 1,
    side: THREE.DoubleSide,
  });
  k.materials.push(innerPaint, carpet, foam);
  const floorY = 0.432,
    wellZ = 3.115;
  const plan = bodyOutline([
    [-0.58, 2.49],
    [0.58, 2.49],
    [0.59, 2.74],
    [0.73, 2.98],
    [0.74, 3.34],
    [0.64, 3.5],
    [-0.64, 3.5],
    [-0.74, 3.34],
    [-0.73, 2.98],
    [-0.59, 2.74],
  ]);
  const floor = part(
    'luggage-floor',
    'Rear floor and spare-wheel well',
    'body',
    [0, -0.5, 1.25],
    6,
    'The stamped rear floor forms the luggage tub. A depressed circular well holds the temporary spare below the removable cargo floor.',
    'Coated stamped steel',
  );
  const stampHeight = (x: number, z: number) => {
    const radius = Math.hypot(x, z - wellZ);
    const well = 0.145 * (1 - THREE.MathUtils.smoothstep(radius, 0.23, 0.315));
    const beads =
      0.006 *
      Math.cos(x * 65) *
      THREE.MathUtils.smoothstep(radius, 0.325, 0.37);
    return 0.409 - well + beads;
  };
  bodyPatch(k, floor, plan, innerPaint, (x, z) => [x, stampHeight(x, z), z], 4);
  outlineTube(
    k,
    floor,
    plan.getPoints().map((p) => [p.x, stampHeight(p.x, p.y) + 0.009, p.y]),
    0.009,
    innerPaint,
  );
  for (const x of [-0.47, 0.47])
    bar(floor, [x, 0.39, 2.59], [x, 0.39, 3.36], 0.013, steel);
  for (const [x, z] of [
    [0, wellZ],
    [-0.44, 3.28],
    [0.44, 3.28],
  ]) {
    const plug = mesh(
      floor,
      new THREE.CylinderGeometry(0.019, 0.02, 0.005, 24),
      rubber,
      [x, stampHeight(x, z) + 0.003, z],
    );
    plug.name = 'floor-drain-plug';
  }

  const wheelHousePoint = (
    side: number,
    u: number,
    v: number,
    trim = false,
  ): P3 => {
    const a = THREE.MathUtils.lerp(-0.18, Math.PI + 0.18, u),
      radius = 0.367 + (trim ? 0.012 : 0);
    const z = 2.7 + Math.cos(a) * radius,
      y = 0.316 + Math.sin(a) * radius;
    const x = side * (0.845 - v * 0.385);
    return [x, y - 0.018 * Math.sin(v * Math.PI), z];
  };
  for (const side of [-1, 1]) {
    const which = side < 0 ? 'left' : 'right',
      label = side < 0 ? 'Left' : 'Right';
    const wheelHouse = part(
      `${which}-rear-wheelhouse`,
      `${label} inner rear wheel housing`,
      'body',
      [side * 0.5, 0.17, 0.85],
      5,
      'The welded inner wheel housing closes the wheel cavity and separates road spray from the passenger and luggage compartments.',
      'Coated stamped steel',
    );
    surface(
      wheelHouse,
      (u, v) => wheelHousePoint(side, u, v),
      innerPaint,
      72,
      20,
    );
    // Inner dome tapers into the rear floor rather than ending in an open arch.
    surface(
      wheelHouse,
      (u, v) => {
        const p = wheelHousePoint(side, u, 1);
        return [
          side * (0.46 + 0.034 * Math.sin(v * Math.PI)),
          THREE.MathUtils.lerp(p[1], 0.403, v),
          p[2],
        ];
      },
      innerPaint,
      72,
      16,
    );
    const quarter = part(
      `${which}-inner-quarter`,
      `${label} inner rear quarter panel`,
      'body',
      [side * 0.65, 0.1, 1.0],
      5,
      'The inner quarter joins the rear wheel housing, lamp mounting pocket and luggage opening. It remains after the removable outer trim is lifted away.',
      'Coated stamped steel',
    );
    surface(
      quarter,
      (u, v) => {
        const z = 2.89 + u * 0.6,
          y = 0.408 + v * (0.5 - 0.05 * u);
        return [
          side * (0.75 + 0.045 * Math.sin(u * Math.PI) - 0.1 * v * v),
          y,
          z,
        ];
      },
      innerPaint,
      40,
      24,
    );
    surface(
      quarter,
      (u, v) => {
        const z = 2.89 + u * 0.6;
        return [
          side * (0.65 + 0.15 * v),
          0.908 - 0.05 * u + 0.012 * Math.sin(v * Math.PI),
          z,
        ];
      },
      innerPaint,
      40,
      16,
    );
    for (const z of [3.06, 3.28])
      tube(
        quarter,
        [
          [side * 0.745, 0.435, z],
          [side * 0.749, 0.61, z],
          [side * 0.688, 0.842, z],
        ],
        0.009,
        innerPaint,
      );
    const liner = part(
      `${which}-trunk-side-liner`,
      `${label} luggage side lining`,
      'cabin',
      [side * 0.43, 0.36, 1.18],
      3,
      'Moulded felt follows the wheel housing and rear quarter. Removing it reveals the metal inner body and wiring route.',
      'Moulded felt',
    );
    surface(
      liner,
      (u, v) => {
        const z = 2.49 + u * 0.94;
        const hump = Math.exp(-(((z - 2.7) / 0.24) ** 2));
        return [
          side * (0.71 - 0.248 * hump - 0.015 * v),
          floorY + v * (0.39 - 0.065 * u),
          z,
        ];
      },
      carpet,
      48,
      24,
    );
    const opening = bodyOutline([
      [0.45, 3.08],
      [0.64, 3.08],
      [0.64, 3.29],
      [0.45, 3.29],
    ]);
    bodyPatch(k, liner, opening, carpet, (x, z) => [side * x, 0.437, z]);
    const retainer = part(
      `${which}-bumper-retainer`,
      `${label} rear bumper side retainer`,
      'body',
      [side * 0.42, 0.15, 1.05],
      3,
      'The side retainer locates the bumper cover under the rear lamp and along its upper quarter-panel attachment.',
      'Polymer and steel',
    );
    tube(
      retainer,
      [
        [side * 0.8, 0.64, 3.07],
        [side * 0.83, 0.76, 3.27],
        [side * 0.8, 0.8, 3.48],
      ],
      0.014,
      black,
    );
    for (let i = 0; i < 5; i++)
      box(
        retainer,
        [0.024, 0.03, 0.036],
        [side * 0.805, 0.71 + i * 0.02, 3.18 + i * 0.057],
        steel,
        0.003,
      );
  }
  const bulkhead = part(
    'rear-inner-panel',
    'Inner rear closing panel',
    'body',
    [0, 0.05, 1.15],
    5,
    'The rear closing panel connects the luggage floor, lock striker and lamp mounting structure. The bumper cover and impact reinforcement sit outside it.',
    'Coated stamped steel',
  );
  surface(
    bulkhead,
    (u, v) => {
      const x = (u * 2 - 1) * 0.7,
        y = 0.408 + v * 0.165;
      return [x, y, rearFace(x, y)[2] - 0.085];
    },
    innerPaint,
    56,
    16,
  );
  for (const x of [-0.48, -0.24, 0.24, 0.48])
    bar(
      bulkhead,
      rearFace(x, 0.435, -0.085),
      rearFace(x, 0.543, -0.085),
      0.007,
      innerPaint,
    );
  const scuff = part(
    'trunk-scuff',
    'Luggage loading-sill trim',
    'cabin',
    [0, 0.22, 1.28],
    2,
    'The moulded loading-sill trim covers the inner closing panel and protects the painted edge of the luggage opening.',
    'Textured polymer',
  );
  surface(
    scuff,
    (u, v) => {
      const x = (u * 2 - 1) * 0.635,
        y = 0.445 + v * 0.115;
      return [x, y, rearFace(x, y)[2] - 0.062];
    },
    black,
    64,
    12,
  );
  for (let i = 0; i < 37; i++) {
    const x = -0.61 + i * 0.034;
    tube(
      scuff,
      [rearFace(x, 0.49, -0.059), rearFace(x, 0.548, -0.059)],
      0.0014,
      foam,
    );
  }

  const mat = part(
    'trunk-liner',
    'Luggage floor board and carpet',
    'cabin',
    [0, 0.75, 1.65],
    2,
    'The shaped carpeted board forms a level load floor above the spare wheel and tool storage. Lift it out to expose the underfloor equipment.',
    'Fibreboard and carpet',
  );
  bodyPatch(k, mat, plan, carpet, (x, z) => [x, floorY, z], 3);
  bodyPatch(k, mat, plan, foam, (x, z) => [x, floorY - 0.01, z], 2);
  outlineTube(
    k,
    mat,
    plan.getPoints().map((p) => [p.x, floorY - 0.005, p.y]),
    0.004,
    carpet,
  );
  const pull = mesh(
    mat,
    new THREE.TorusGeometry(0.022, 0.003, 8, 32, Math.PI),
    black,
    [0, floorY + 0.004, 3.4],
  );
  pull.rotation.x = -Math.PI / 2;

  const spare = part(
    'spare-wheel',
    'Temporary spare wheel',
    'cabin',
    [0, 0.82, 1.9],
    4,
    'The compact spare is secured in the floor well, beneath the luggage-floor board. Its pressed steel wheel has a dished centre and ventilation openings.',
    'Rubber and steel',
  );
  const profile = new THREE.SplineCurve([
    new THREE.Vector2(0.209, -0.057),
    new THREE.Vector2(0.278, -0.061),
    new THREE.Vector2(0.301, -0.036),
    new THREE.Vector2(0.304, 0.018),
    new THREE.Vector2(0.289, 0.054),
    new THREE.Vector2(0.213, 0.061),
  ]).getPoints(32);
  mesh(spare, new THREE.LatheGeometry(profile, 80), rubber, [0, 0.333, wellZ]);
  for (const y of [-0.021, -0.008, 0.005, 0.018]) {
    const t = mesh(
      spare,
      new THREE.TorusGeometry(0.303, 0.0018, 6, 80),
      black,
      [0, 0.333 + y, wellZ],
    );
    t.rotation.x = Math.PI / 2;
  }
  const wheelFace = new THREE.Shape();
  wheelFace.absarc(0, 0, 0.207, 0, Math.PI * 2, false);
  const hubHole = new THREE.Path();
  hubHole.absarc(0, 0, 0.031, 0, Math.PI * 2, true);
  wheelFace.holes.push(hubHole);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const hole = new THREE.Path();
    hole.absellipse(
      Math.cos(a) * 0.15,
      Math.sin(a) * 0.15,
      0.024,
      0.011,
      0,
      Math.PI * 2,
      true,
      a,
    );
    wheelFace.holes.push(hole);
  }
  const disk = new THREE.ExtrudeGeometry(wheelFace, {
    depth: 0.006,
    bevelEnabled: true,
    bevelSize: 0.002,
    bevelThickness: 0.001,
    bevelSegments: 2,
    curveSegments: 24,
  });
  disk.rotateX(Math.PI / 2);
  mesh(spare, disk, steel, [0, 0.382, wellZ]);
  mesh(
    spare,
    new THREE.CylinderGeometry(0.212, 0.212, 0.097, 64, 1, true),
    steel,
    [0, 0.332, wellZ],
  );
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    mesh(spare, new THREE.CylinderGeometry(0.007, 0.007, 0.007, 12), black, [
      Math.cos(a) * 0.057,
      0.387,
      wellZ + Math.sin(a) * 0.057,
    ]);
  }
  const clamp = part(
    'spare-clamp',
    'Spare-wheel retaining screw',
    'cabin',
    [0, 1.05, 1.9],
    1,
    'The threaded hold-down clamps the spare wheel into the floor well so it cannot move around during driving.',
    'Steel and moulded polymer',
  );
  bar(clamp, [0, 0.267, wellZ], [0, 0.398, wellZ], 0.005, alloy);
  box(clamp, [0.086, 0.018, 0.026], [0, 0.398, wellZ], black, 0.008);
  const toolTray = part(
    'trunk-tool-tray',
    'Underfloor tool tray',
    'cabin',
    [-0.2, 0.64, 1.8],
    3,
    'A moulded storage insert locates the wheel-changing tools beside the compact spare beneath the cargo board.',
    'Expanded polymer',
  );
  const trayShape = bodyOutline([
    [-0.62, 2.86],
    [-0.34, 2.86],
    [-0.34, 3.39],
    [-0.62, 3.39],
  ]);
  const cavity = bodyOutline([
    [-0.58, 2.95],
    [-0.39, 2.95],
    [-0.39, 3.27],
    [-0.58, 3.27],
  ]);
  trayShape.holes.push(cavity);
  const trayGeo = new THREE.ExtrudeGeometry(trayShape, {
    depth: 0.05,
    bevelEnabled: true,
    bevelSize: 0.007,
    bevelThickness: 0.005,
    bevelSegments: 3,
  });
  trayGeo.rotateX(Math.PI / 2);
  mesh(toolTray, trayGeo, foam, [0, 0.416, 0]);
  const jack = part(
    'wheel-jack',
    'Scissor jack and wheel wrench',
    'cabin',
    [-0.65, 0.7, 1.8],
    3,
    'The compact scissor jack and wrench stow below the luggage floor. Their crossed links fold down around the adjustment screw.',
    'Coated steel',
  );
  for (const x of [-0.49, -0.46]) {
    bar(jack, [x, 0.351, 2.99], [x, 0.397, 3.22], 0.01, steel);
    bar(jack, [x, 0.351, 3.22], [x, 0.397, 2.99], 0.01, steel);
  }
  bar(jack, [-0.478, 0.375, 2.95], [-0.478, 0.375, 3.27], 0.0045, alloy);
  box(jack, [0.092, 0.013, 0.055], [-0.478, 0.343, 3.105], steel, 0.003);
  tube(
    jack,
    [
      [-0.58, 0.39, 2.94],
      [-0.58, 0.39, 3.26],
      [-0.54, 0.39, 3.28],
    ],
    0.006,
    steel,
  );

  const lidFrame = part(
    'trunk-inner-frame',
    'Trunk lid inner reinforcement',
    'body',
    [0, -0.25, 0.3],
    3,
    'A stamped inner skin stiffens the outer trunk panel. Service openings, folded edges and mounting pads support the lock and hinges.',
    'Painted stamped steel',
    lid,
  );
  const innerShape = new THREE.Shape(
    trunkShutLine()
      .getPoints(32)
      .map((p) => new THREE.Vector2(p.x * 0.96, 0.591 + (p.y - 0.591) * 0.94)),
  );
  for (const x of [-0.36, 0.36]) {
    const h = new THREE.Path();
    h.absellipse(x, 0.752, 0.155, 0.081, 0, Math.PI * 2, true, 0);
    innerShape.holes.push(h);
  }
  bodyPatch(k, lidFrame, innerShape, innerPaint, (x, y) =>
    rearFace(x, y, -0.028),
  );
  const deckShape = bodyOutline([
    [-0.692, 0.045],
    [0.692, 0.045],
    [0.692, 0.95],
    [-0.692, 0.95],
  ]);
  for (const x of [-0.35, 0.35]) {
    const h = new THREE.Path();
    h.absellipse(x, 0.47, 0.175, 0.21, 0, Math.PI * 2, true, 0);
    deckShape.holes.push(h);
  }
  bodyPatch(k, lidFrame, deckShape, innerPaint, (x, u) => {
    const p = deck(u, (x / 0.84 + 1) / 2);
    p[1] -= 0.024;
    return p;
  });
  const lidTrim = part(
    'trunk-lid-liner',
    'Trunk lid felt lining',
    'cabin',
    [0, -0.37, 0.38],
    2,
    'The moulded felt lining covers the trunk-lid reinforcement while leaving the latch accessible. Push clips secure it to the inner skin.',
    'Moulded felt',
    lid,
  );
  const lining = new THREE.Shape(
    trunkShutLine()
      .getPoints(32)
      .map((p) => new THREE.Vector2(p.x * 0.89, 0.61 + (p.y - 0.61) * 0.8)),
  );
  bodyPatch(k, lidTrim, lining, carpet, (x, y) => rearFace(x, y, -0.045));
  for (const x of [-0.55, -0.28, 0, 0.28, 0.55])
    for (const y of [0.64, 0.84]) {
      const clip = mesh(
        lidTrim,
        new THREE.CylinderGeometry(0.005, 0.005, 0.005, 12),
        black,
        rearFace(x, y, -0.05),
      );
      clip.rotation.x = Math.PI / 2;
    }
  const lock = part(
    'trunk-latch',
    'Trunk latch and release',
    'body',
    [0, -0.13, 0.42],
    2,
    'The latch on the lid captures the body-mounted striker. The release actuator opens the catch; the emergency handle provides release from inside.',
    'Steel and polymer',
    lid,
  );
  box(lock, [0.082, 0.054, 0.025], rearFace(0, 0.601, -0.023), steel, 0.01);
  box(lock, [0.04, 0.025, 0.031], rearFace(0.055, 0.625, -0.028), black, 0.006);
  const release = new THREE.MeshStandardMaterial({
    color: '#dbe2c8',
    roughness: 0.7,
  });
  k.materials.push(release);
  box(
    lock,
    [0.029, 0.042, 0.007],
    rearFace(0.082, 0.61, -0.06),
    release,
    0.004,
  );
  const striker = part(
    'trunk-striker',
    'Trunk lock striker',
    'body',
    [0, 0.08, 1.4],
    2,
    'The steel striker is bolted to the rear closing panel and is captured by the trunk latch when the lid closes.',
    'Steel',
  );
  tube(
    striker,
    [
      rearFace(-0.021, 0.548, -0.059),
      rearFace(-0.021, 0.582, -0.059),
      rearFace(0.021, 0.582, -0.059),
      rearFace(0.021, 0.548, -0.059),
    ],
    0.0035,
    alloy,
  );

  const seal = part(
    'trunk-seal',
    'Luggage-opening weatherstrip',
    'body',
    [0, 0.65, 1.0],
    0,
    'The continuous rubber weatherstrip follows the complete luggage opening, sealing against the underside of the closed lid.',
    'EPDM rubber',
  );
  const perimeter: P3[] = trunkShutLine()
    .getPoints(64)
    .map((p) => rearFace(p.x * 0.985, 0.579 + (p.y - 0.579) * 0.985, -0.038));
  for (let i = 0; i <= 40; i++) {
    const p = deck(1 - i / 40, (0.711 / 0.84 + 1) / 2);
    p[1] -= 0.025;
    perimeter.push(p);
  }
  for (let i = 0; i <= 40; i++) {
    const p = deck(
      0,
      (THREE.MathUtils.lerp(0.711, -0.711, i / 40) / 0.84 + 1) / 2,
    );
    p[1] -= 0.025;
    perimeter.push(p);
  }
  for (let i = 0; i <= 40; i++) {
    const p = deck(i / 40, (-0.711 / 0.84 + 1) / 2);
    p[1] -= 0.025;
    perimeter.push(p);
  }
  perimeter.push(perimeter[0]);
  outlineTube(k, seal, perimeter, 0.0075, rubber);
  for (const side of [-1, 1]) {
    const which = side < 0 ? 'left' : 'right',
      label = side < 0 ? 'Left' : 'Right';
    const hinge = part(
      `${which}-trunk-hinge`,
      `${label} trunk hinge arm`,
      'body',
      [side * 0.35, 0.5, 0.8],
      3,
      'The curved gooseneck hinge arm pivots under the rear parcel shelf and supports the trunk lid. The lid bolts to its upper mounting pad.',
      'Painted steel',
      motion,
    );
    hinge.position.set(-pivot[0], -pivot[1], -pivot[2]);
    tube(
      hinge,
      [
        [side * 0.56, 0.905, 2.89],
        [side * 0.56, 0.807, 2.98],
        [side * 0.56, 0.775, 3.115],
        [side * 0.56, 0.831, 3.225],
        [side * 0.56, 0.978, 3.26],
      ],
      0.013,
      innerPaint,
    );
    box(
      hinge,
      [0.071, 0.014, 0.101],
      [side * 0.56, 0.976, 3.257],
      innerPaint,
      0.005,
    );
    for (const z of [3.229, 3.284])
      mesh(hinge, new THREE.CylinderGeometry(0.008, 0.008, 0.01, 6), alloy, [
        side * 0.56,
        0.986,
        z,
      ]);
    const bracket = part(
      `${which}-trunk-hinge-bracket`,
      `${label} trunk hinge bracket`,
      'body',
      [side * 0.4, 0.35, 0.65],
      5,
      'The welded bracket transfers trunk hinge loads into the rear parcel-shelf structure. Its pivot stays fixed while the gooseneck arm rotates.',
      'Stamped steel',
    );
    box(
      bracket,
      [0.056, 0.068, 0.091],
      [side * 0.56, 0.905, 2.89],
      innerPaint,
      0.008,
    );
    const pin = mesh(
      bracket,
      new THREE.CylinderGeometry(0.012, 0.012, 0.074, 24),
      steel,
      [side * 0.56, 0.905, 2.89],
    );
    pin.rotation.z = Math.PI / 2;
  }
  const springs = part(
    'trunk-torsion-rods',
    'Trunk hinge torsion rods',
    'body',
    [0, 0.55, 0.65],
    3,
    'Two crossing spring-steel torsion rods counterbalance the trunk lid. Their ends bear on the hinge arms as the lid moves.',
    'Spring steel',
  );
  for (const side of [-1, 1])
    tube(
      springs,
      [
        [side * 0.59, 0.86, 2.9],
        [side * 0.48, 0.855, 2.965],
        [-side * 0.46, 0.85, 2.965],
        [-side * 0.54, 0.795, 3.02],
      ],
      0.004,
      steel,
    );
  const absorber = part(
    'rear-bumper-absorber',
    'Rear bumper energy absorber',
    'body',
    [0, 0.06, 1.5],
    2,
    'The energy absorber fills the space between the moulded bumper cover and its structural reinforcement.',
    'Energy-absorbing polymer',
  );
  surface(
    absorber,
    (u, v) => {
      const x = (u * 2 - 1) * 0.67;
      return [x, 0.31 + v * 0.145, rearFace(x, 0.4)[2] - 0.12];
    },
    foam,
    48,
    16,
  );
  const rearHarness = part(
    'rear-body-harness',
    'Rear lamps and trunk wiring',
    'electrical',
    [0.45, 0.45, 1.45],
    3,
    'The rear harness follows the luggage-compartment perimeter and supplies the rear lights, latch and cargo lamp. A flexible section reaches the moving lid.',
    'Insulated copper and polymer conduit',
  );
  tube(
    rearHarness,
    [
      [-0.7, 0.76, 2.91],
      [-0.72, 0.68, 3.29],
      [-0.64, 0.51, 3.45],
      [0.64, 0.51, 3.45],
      [0.72, 0.69, 3.29],
    ],
    0.006,
    black,
  );
  const lamp = part(
    'cargo-lamp',
    'Luggage compartment lamp',
    'electrical',
    [0, 0.45, 1.15],
    1,
    'The small lamp under the rear shelf illuminates the luggage compartment when the trunk is open.',
    'Polymer lens and electrical contacts',
  );
  box(lamp, [0.072, 0.015, 0.044], [0.23, 0.901, 2.945], black, 0.005);
  box(lamp, [0.06, 0.006, 0.032], [0.23, 0.89, 2.945], alloy, 0.003);
}
