import * as THREE from 'three';
import type { ModelKit, P3 } from './vehicle-model';

export function createVehicleCabin(k: ModelKit, group: THREE.Group) {
  const { box, mesh, bar, tube, black, alloy, steel } = k;
  const cloth = new THREE.MeshStandardMaterial({
      color: '#363b40',
      roughness: 0.96,
    }),
    trim = new THREE.MeshStandardMaterial({
      color: '#62666a',
      roughness: 0.82,
    });
  k.materials.push(cloth, trim);
  const part = (
    id: string,
    name: string,
    offset: P3,
    stage: number,
    description: string,
    material = 'Fabric, polymer and metal',
  ) =>
    k.part(group, {
      id: `car-${id}`,
      name,
      system: 'cabin',
      offset,
      stage,
      description,
      material,
    });
  for (const side of [-1, 1]) {
    const label = side < 0 ? 'Driver' : 'Front passenger',
      id = side < 0 ? 'driver' : 'passenger',
      x = side * 0.38;
    const rails = part(
      `${id}-seat-rails`,
      `${label} seat rails`,
      [side * 0.55, -0.15, 0],
      5,
      'Sliding steel rails locate the seat and allow fore-and-aft adjustment.',
      'Steel',
    );
    for (const dx of [-0.14, 0.14]) {
      box(rails, [0.028, 0.03, 0.52], [x + dx, 0.307, 1.28], steel, 0.005);
      bar(rails, [x + dx, 0.32, 1.07], [x + dx, 0.385, 1.15], 0.014, steel);
    }
    const cushion = part(
      `${id}-seat`,
      `${label} seat cushion`,
      [side * 0.55, 0.82, 0],
      3,
      'Foam bolsters and textile upholstery fit over a metal seat frame.',
    );
    box(cushion, [0.41, 0.11, 0.46], [x, 0.413, 1.26], cloth, 0.05);
    for (const dx of [-0.172, 0.172])
      box(cushion, [0.072, 0.117, 0.45], [x + dx, 0.442, 1.26], black, 0.032);
    for (let j = 0; j < 7; j++)
      tube(
        cushion,
        [
          [x - 0.11, 0.471, 1.09 + j * 0.047],
          [x + 0.11, 0.471, 1.09 + j * 0.047],
        ],
        0.0013,
        trim,
      );
    const seatback = part(
      `${id}-seatback`,
      `${label} seat back`,
      [side * 0.55, 0.9, 0.4],
      3,
      'The reclinable seat back supports the occupant and carries a height-adjustable head restraint.',
    );
    const back = box(
      seatback,
      [0.405, 0.5, 0.125],
      [x, 0.718, 1.479],
      cloth,
      0.05,
    );
    back.rotation.x = -0.12;
    for (const dx of [-0.173, 0.173]) {
      const bolster = box(
        seatback,
        [0.06, 0.425, 0.15],
        [x + dx, 0.72, 1.445],
        black,
        0.029,
      );
      bolster.rotation.x = -0.12;
    }
    const headrest = part(
      `${id}-headrest`,
      `${label} head restraint`,
      [side * 0.55, 1.35, 0.42],
      2,
      'Two steel posts support the padded head restraint.',
    );
    for (const dx of [-0.067, 0.067])
      bar(headrest, [x + dx, 0.918, 1.5], [x + dx, 1.035, 1.51], 0.006, alloy);
    box(headrest, [0.23, 0.16, 0.095], [x, 1.04, 1.515], cloth, 0.041);
    const belt = part(
      `${id}-belt`,
      `${label} seat belt`,
      [side * 0.82, 0.28, 0.18],
      4,
      'A three-point belt runs from the upper pillar guide to the buckle and lower anchor.',
    );
    tube(
      belt,
      [
        [side * 0.765, 0.32, 1.7],
        [side * 0.745, 1.19, 1.7],
        [side * 0.18, 0.49, 1.48],
      ],
      0.011,
      black,
    );
    box(belt, [0.035, 0.064, 0.032], [side * 0.18, 0.47, 1.48], black, 0.006);
  }
  const rearSeat = part(
    'rear-seat',
    'Rear bench cushion',
    [0, 0.85, 1.4],
    3,
    'The rear bench provides three seating positions above the fuel tank.',
  );
  box(rearSeat, [1.25, 0.145, 0.44], [0, 0.432, 2.235], cloth, 0.046);
  const rearBack = part(
    'rear-seatback',
    'Rear seat back',
    [0, 1.05, 1.5],
    3,
    'The rear backrest separates the passenger cabin from the luggage compartment.',
  );
  const back = box(
    rearBack,
    [1.25, 0.42, 0.12],
    [0, 0.703, 2.46],
    cloth,
    0.043,
  );
  back.rotation.x = -0.12;
  for (const x of [-0.4, 0, 0.4]) {
    const r = part(
      `rear-headrest-${x}`,
      `${x < 0 ? 'Left' : x > 0 ? 'Right' : 'Centre'} rear head restraint`,
      [x, 1.4, 1.55],
      2,
      'A padded head restraint sits above the rear backrest.',
    );
    for (const dx of [-0.05, 0.05])
      bar(r, [x + dx, 0.89, 2.475], [x + dx, 0.98, 2.485], 0.006, alloy);
    box(r, [0.19, 0.13, 0.085], [x, 0.985, 2.48], cloth, 0.031);
  }
  const carpet = part(
    'carpet',
    'Cabin carpet',
    [0, 0.28, 0.1],
    5,
    'Moulded carpet and insulation cover the floor pan.',
  );
  box(carpet, [1.38, 0.022, 1.93], [0, 0.295, 1.65], black, 0.012);
  const dash = part(
    'dashboard',
    'Dashboard assembly',
    [0, 0.82, -0.55],
    3,
    'The dashboard houses the instrument binnacle, ventilation outlets and passenger airbag enclosure.',
  );
  box(dash, [1.36, 0.185, 0.285], [0, 0.79, 0.83], black, 0.044);
  box(dash, [0.37, 0.035, 0.24], [-0.37, 0.901, 0.83], black, 0.017);
  box(dash, [0.3, 0.097, 0.012], [-0.37, 0.866, 0.97], steel, 0.013);
  for (const x of [-0.615, -0.135, 0.135, 0.615]) {
    box(dash, [0.108, 0.064, 0.03], [x, 0.831, 0.977], alloy, 0.009);
    for (let j = 0; j < 4; j++)
      box(
        dash,
        [0.095, 0.005, 0.011],
        [x, 0.812 + j * 0.012, 0.997],
        black,
        0.001,
      );
  }
  const screen = part(
    'infotainment',
    'Centre display',
    [0, 1.25, -0.35],
    2,
    'The freestanding centre display sits above the central climate controls.',
    'Glass and polymer',
  );
  box(screen, [0.216, 0.133, 0.028], [0, 0.949, 0.952], black, 0.013);
  box(screen, [0.191, 0.105, 0.002], [0, 0.951, 0.969], steel, 0.006);
  const controls = part(
    'climate-controls',
    'Climate control panel',
    [0, 0.7, 0.06],
    3,
    'The driver sets cabin temperature and airflow below the centre vents.',
  );
  box(controls, [0.255, 0.055, 0.035], [0, 0.718, 0.973], black, 0.01);
  for (const x of [-0.089, 0.089]) {
    const knob = mesh(
      controls,
      new THREE.CylinderGeometry(0.018, 0.018, 0.013, 24),
      alloy,
      [x, 0.723, 1],
    );
    knob.rotation.x = Math.PI / 2;
  }
  const console = part(
    'console',
    'Centre console and shifter',
    [0, 0.78, 0.3],
    3,
    'The console holds the CVT selector, cup holders and padded armrest.',
  );
  box(console, [0.235, 0.18, 0.66], [0, 0.389, 1.32], black, 0.028);
  box(console, [0.19, 0.05, 0.22], [0, 0.5, 1.51], cloth, 0.025);
  box(console, [0.14, 0.01, 0.17], [0, 0.482, 1.105], alloy, 0.013);
  bar(console, [0, 0.48, 1.12], [0, 0.582, 1.13], 0.012, steel);
  box(console, [0.052, 0.045, 0.075], [0, 0.59, 1.13], black, 0.018);
  for (const z of [1.26, 1.365]) {
    const ring = mesh(
      console,
      new THREE.TorusGeometry(0.039, 0.006, 8, 32),
      steel,
      [0, 0.486, z],
    );
    ring.rotation.x = Math.PI / 2;
  }
  const column = part(
    'steering-column',
    'Steering column',
    [0, 0.45, -0.3],
    4,
    'The steering column connects the wheel to the rack through universal joints.',
    'Steel and polymer',
  );
  bar(column, [-0.37, 0.843, 0.99], [-0.37, 0.49, 0.7], 0.027, black);
  const steering = part(
    'steering-wheel',
    'Steering wheel',
    [-0.32, 0.95, -0.1],
    2,
    'The steering wheel carries the driver airbag module and thumb controls.',
  );
  const rim = mesh(
    steering,
    new THREE.TorusGeometry(0.158, 0.014, 12, 64),
    black,
    [-0.37, 0.843, 0.99],
  );
  rim.rotation.x = -0.5;
  box(steering, [0.123, 0.099, 0.05], [-0.37, 0.843, 0.99], black, 0.031);
  for (const dx of [-0.13, 0.13])
    bar(steering, [-0.37, 0.84, 0.99], [-0.37 + dx, 0.843, 0.99], 0.014, alloy);
  bar(steering, [-0.37, 0.825, 0.995], [-0.37, 0.713, 1.05], 0.014, black);
  const pedals = part(
    'pedals',
    'Accelerator and brake pedals',
    [-0.5, 0.1, -0.45],
    4,
    'The brake pedal operates the brake booster; the accelerator provides an electronic torque request.',
  );
  for (const [x, w] of [
    [-0.43, 0.08],
    [-0.3, 0.043],
  ]) {
    bar(pedals, [x, 0.52, 0.86], [x, 0.34, 1.04], 0.008, steel);
    const pad = box(pedals, [w, 0.077, 0.019], [x, 0.33, 1.047], black, 0.005);
    pad.rotation.x = -0.2;
  }
  const headliner = part(
    'headliner',
    'Headliner',
    [0, 1.4, 0.1],
    3,
    'The fabric headliner covers the roof reinforcements.',
  );
  k.surface(
    headliner,
    (u, v) => {
      const z = 1.17 + u * 1.14,
        x = (v * 2 - 1) * 0.61;
      return [x, 1.335 - 0.19 * (z - 1.7) ** 2 - 0.025 * (x / 0.61) ** 2, z];
    },
    trim,
    28,
    18,
  );
  const bows = part(
    'roof-bows',
    'Roof reinforcing bows',
    [0, 1.65, 0.15],
    5,
    'Transverse roof bows stiffen the passenger-cell roof.',
    'Steel',
  );
  for (const z of [1.33, 1.85, 2.22]) {
    const y = 1.338 - 0.19 * (z - 1.7) ** 2;
    tube(
      bows,
      [
        [-0.62, y - 0.026, z],
        [0, y, z],
        [0.62, y - 0.026, z],
      ],
      0.012,
      steel,
    );
  }
  const shelf = part(
    'parcel-shelf',
    'Rear parcel shelf',
    [0, 0.75, 1.1],
    3,
    'The rear shelf spans the body below the back window.',
  );
  box(shelf, [1.32, 0.035, 0.37], [0, 0.926, 2.75], black, 0.018);
  const luggage = part(
    'trunk-liner',
    'Luggage compartment liner',
    [0, 0.6, 1.65],
    4,
    'The carpeted luggage well lies behind the rear seats.',
  );
  box(luggage, [1.23, 0.025, 0.65], [0, 0.4, 3.085], black, 0.012);
  for (const side of [-1, 1])
    box(luggage, [0.025, 0.35, 0.6], [side * 0.63, 0.55, 3.1], black, 0.012);
  const spare = part(
    'spare-wheel',
    'Temporary spare wheel',
    [0, 0.5, 1.9],
    4,
    'The compact spare sits in the well below the luggage floor.',
    'Rubber and steel',
  );
  const tire = mesh(
    spare,
    new THREE.TorusGeometry(0.222, 0.048, 16, 64),
    black,
    [0, 0.32, 3.12],
  );
  tire.rotation.x = Math.PI / 2;
  mesh(
    spare,
    new THREE.CylinderGeometry(0.184, 0.184, 0.048, 48),
    steel,
    [0, 0.32, 3.12],
  );
}
