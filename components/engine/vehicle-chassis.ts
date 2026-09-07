import * as THREE from 'three';
import { modelKit, batchVehicleModel, type P3 } from './vehicle-model';
import { createVehicleTransmission } from './vehicle-transmission';
import type { VehicleSystem } from '../../lib/engine/vehicle-parts';

export function createVehicleChassis() {
  const group = new THREE.Group();
  group.name = 'unibody-chassis';
  const k = modelKit(),
    { box, tube, bar, mesh, steel, alloy, black, rubber } = k;
  const part = (
    id: string,
    name: string,
    system: VehicleSystem,
    offset: P3,
    stage: number,
    description: string,
    material = 'Steel',
  ) =>
    k.part(group, {
      id: `car-${id}`,
      name,
      system,
      offset,
      stage,
      description,
      material,
    });
  const floor = part(
    'floor',
    'Stamped floor and sills',
    'body',
    [0, -0.32, 0],
    6,
    'The welded floor, sills and crossmembers form the lower passenger safety structure. Separation illustrates welded construction, not a routine service operation.',
  );
  for (const side of [-1, 1]) {
    box(floor, [0.63, 0.035, 2.02], [side * 0.365, 0.21, 1.69], steel, 0.016);
    box(floor, [0.095, 0.105, 2.12], [side * 0.74, 0.245, 1.66], steel, 0.02);
    for (const z of [0.86, 1.4, 2.05, 2.55])
      box(floor, [0.69, 0.065, 0.09], [side * 0.385, 0.256, z], steel, 0.014);
    for (let x = 0.12; x < 0.65; x += 0.105)
      tube(
        floor,
        [
          [side * x, 0.232, 0.83],
          [side * x, 0.239, 1.19],
          [side * x, 0.232, 1.39],
        ],
        0.008,
        steel,
      );
    tube(
      floor,
      [
        [side * 0.74, 0.22, 2.51],
        [side * 0.68, 0.39, 2.83],
        [side * 0.68, 0.32, 3.32],
      ],
      0.047,
      steel,
    );
    box(floor, [0.075, 0.08, 0.34], [side * 0.67, 0.34, -0.39], steel, 0.015);
  }
  box(floor, [1.43, 0.07, 0.085], [0, 0.255, 0.68], steel, 0.012);
  box(floor, [0.15, 0.085, 1.92], [0, 0.265, 1.61], steel, 0.024);
  const firewall = part(
    'firewall',
    'Firewall and front bulkhead',
    'body',
    [0, 0.55, 0.34],
    6,
    'The welded bulkhead separates the passenger compartment from heat, noise and equipment in the engine bay.',
  );
  box(firewall, [1.35, 0.27, 0.028], [0, 0.415, 0.685], steel, 0.013);
  for (const side of [-1, 1])
    box(firewall, [0.2, 0.25, 0.032], [side * 0.62, 0.615, 0.69], steel, 0.016);
  const subframe = part(
    'front-subframe',
    'Front suspension subframe',
    'suspension',
    [0, -0.65, -0.25],
    5,
    'This removable cradle carries the lower suspension and supports powertrain mounting loads.',
  );
  for (const side of [-1, 1])
    tube(
      subframe,
      [
        [side * 0.43, 0.165, -0.25],
        [side * 0.47, 0.15, 0.1],
        [side * 0.42, 0.18, 0.39],
      ],
      0.035,
      steel,
    );
  box(subframe, [0.88, 0.065, 0.075], [0, 0.175, 0.36], steel, 0.01);
  for (const [id, name, z, y, w] of [
    ['front', 'Front bumper reinforcement', -0.56, 0.355, 1.26],
    ['rear', 'Rear bumper reinforcement', 3.34, 0.32, 1.38],
  ] as const) {
    const beam = part(
      `${id}-crash-beam`,
      name,
      'body',
      [0, 0.08, id === 'front' ? -0.85 : 0.85],
      2,
      'The energy-absorbing reinforcement sits behind the painted bumper cover. Its crush attachments transfer loads into the body structure.',
      'Aluminium / steel',
    );
    box(beam, [w, 0.08, 0.11], [0, y, z], alloy, 0.02);
    for (const side of [-1, 1])
      box(
        beam,
        [0.11, 0.09, 0.16],
        [side * 0.55, y, z + (id === 'front' ? 0.1 : -0.1)],
        steel,
        0.018,
      );
  }
  const rack = part(
    'steering-rack',
    'Steering rack and bellows',
    'suspension',
    [0, -0.22, -0.65],
    4,
    'The rack converts steering-wheel rotation into side-to-side tie-rod travel. Bellows protect the sliding rack ends.',
    'Aluminium, steel and rubber',
  );
  bar(rack, [-0.49, 0.3, 0.22], [0.49, 0.3, 0.22], 0.022, alloy);
  const shafts: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const s = side < 0 ? 'left' : 'right',
      label = side < 0 ? 'Left' : 'Right';
    const arm = part(
      `front-${s}-control-arm`,
      `${label} front lower control arm`,
      'suspension',
      [side * 0.6, -0.35, -0.3],
      4,
      'The L-shaped lower arm locates the front wheel through two body bushings and an outer ball joint.',
    );
    bar(arm, [side * 0.43, 0.19, -0.21], [side * 0.71, 0.29, 0], 0.023, alloy);
    bar(arm, [side * 0.45, 0.19, 0.3], [side * 0.71, 0.29, 0], 0.023, alloy);
    bar(
      arm,
      [side * 0.43, 0.19, -0.21],
      [side * 0.45, 0.19, 0.3],
      0.017,
      steel,
    );
    const knuckle = part(
      `front-${s}-knuckle`,
      `${label} front steering knuckle`,
      'suspension',
      [side * 0.65, -0.05, 0],
      4,
      'The knuckle joins the hub bearing, strut, lower ball joint and steering tie rod.',
      'Cast iron / steel',
    );
    box(knuckle, [0.08, 0.15, 0.08], [side * 0.71, 0.318, 0], steel, 0.018);
    const strut = part(
      `front-${s}-strut`,
      `${label} front MacPherson damper`,
      'suspension',
      [side * 0.48, 0.5, -0.14],
      4,
      'The telescopic damper controls suspension movement and is a structural wheel-location member.',
    );
    bar(
      strut,
      [side * 0.71, 0.31, 0],
      [side * 0.59, 0.69, 0.055],
      0.032,
      steel,
    );
    bar(
      strut,
      [side * 0.68, 0.39, 0.015],
      [side * 0.59, 0.72, 0.055],
      0.013,
      alloy,
    );
    const spring = part(
      `front-${s}-spring`,
      `${label} front coil spring`,
      'suspension',
      [side * 0.8, 0.58, 0.12],
      3,
      'The spring supports the front corner of the car. It surrounds the damper in the MacPherson strut assembly.',
      'Spring steel',
    );
    const points: P3[] = [];
    for (let i = 0; i <= 112; i++) {
      const a = (i / 112) * Math.PI * 12;
      points.push([
        side * 0.6 + Math.cos(a) * 0.056,
        0.46 + (i / 112) * 0.23,
        0.045 + Math.sin(a) * 0.056,
      ]);
    }
    tube(spring, points, 0.0085, black);
    const mount = part(
      `front-${s}-top-mount`,
      `${label} front strut mount`,
      'suspension',
      [side * 0.42, 0.95, 0],
      3,
      'A rubber-isolated top mount and bearing connect the strut to the tower and allow steering rotation.',
      'Steel and elastomer',
    );
    box(mount, [0.17, 0.045, 0.18], [side * 0.59, 0.731, 0.06], steel, 0.035);
    const tie = part(
      `${s}-tie-rod`,
      `${label} steering tie rod`,
      'suspension',
      [side * 0.75, -0.15, -0.45],
      3,
      'This jointed link transfers rack movement to the steering arm on the knuckle.',
    );
    bar(tie, [side * 0.44, 0.3, 0.22], [side * 0.71, 0.31, 0.07], 0.009, steel);
    for (let j = 0; j < 7; j++)
      bar(
        rack,
        [side * (0.38 + j * 0.012), 0.3, 0.22],
        [side * (0.386 + j * 0.012), 0.3, 0.22],
        0.028,
        rubber,
      );
    const shaft = part(
      `${s}-halfshaft`,
      `${label} front drive shaft and CV joints`,
      'powertrain',
      [side * 0.86, 0.13, -0.4],
      4,
      'Constant-velocity joints transmit torque from the transaxle to a steering and moving front wheel.',
      'Steel and rubber',
    );
    const rotor = new THREE.Group();
    rotor.position.set(0, 0.325, 0.025);
    shaft.add(rotor);
    shafts.push(rotor);
    bar(rotor, [side * 0.43, 0, 0], [side * 0.715, 0, 0], 0.012, alloy);
    for (const x of [side * 0.46, side * 0.675])
      for (let j = 0; j < 6; j++)
        bar(
          rotor,
          [x + j * 0.006, 0, 0],
          [x + j * 0.006 + 0.004, 0, 0],
          0.025 + Math.sin((j / 5) * Math.PI) * 0.009,
          rubber,
        );
    const damper = part(
      `rear-${s}-damper`,
      `${label} rear shock absorber`,
      'suspension',
      [side * 0.68, 0.35, 0.5],
      4,
      'The rear damper controls oscillation while the separate spring supports vehicle weight.',
    );
    bar(damper, [side * 0.71, 0.3, 2.7], [side * 0.6, 0.72, 2.8], 0.027, steel);
    bar(
      damper,
      [side * 0.67, 0.47, 2.735],
      [side * 0.6, 0.76, 2.8],
      0.011,
      alloy,
    );
    const coil = part(
      `rear-${s}-spring`,
      `${label} rear coil spring`,
      'suspension',
      [side * 0.46, 0.68, 0.65],
      3,
      'A separate coil spring sits between the torsion-beam spring seat and the body.',
      'Spring steel',
    );
    const rearSpring: P3[] = [];
    for (let i = 0; i <= 100; i++) {
      const a = (i / 100) * Math.PI * 10;
      rearSpring.push([
        side * 0.53 + Math.cos(a) * 0.057,
        0.31 + (i / 100) * 0.24,
        2.69 + Math.sin(a) * 0.057,
      ]);
    }
    tube(coil, rearSpring, 0.008, black);
    const brake = part(
      `${s}-brake-pipes`,
      `${label} brake pipes and flexible hoses`,
      'brakes',
      [side * 0.65, -0.15, 0.25],
      5,
      'Rigid pipes carry hydraulic pressure along the body; flexible sections accommodate suspension and steering movement.',
      'Steel tube / reinforced rubber',
    );
    tube(
      brake,
      [
        [side * 0.51, 0.25, 0.25],
        [side * 0.65, 0.26, 0.65],
        [side * 0.65, 0.26, 2.36],
        [side * 0.69, 0.33, 2.66],
      ],
      0.0045,
      alloy,
    );
  }
  const rearAxle = part(
    'rear-torsion-beam',
    'Rear torsion-beam axle',
    'suspension',
    [0, -0.67, 0.55],
    5,
    'The 2025 US Corolla LE uses two trailing arms joined by a twist beam. The beam twists during unequal wheel movement.',
  );
  box(rearAxle, [1.15, 0.095, 0.09], [0, 0.27, 2.48], steel, 0.02);
  for (const side of [-1, 1]) {
    tube(
      rearAxle,
      [
        [side * 0.64, 0.28, 2.15],
        [side * 0.65, 0.26, 2.48],
        [side * 0.71, 0.3, 2.7],
      ],
      0.042,
      steel,
    );
    box(rearAxle, [0.18, 0.027, 0.2], [side * 0.53, 0.3, 2.69], steel, 0.03);
    box(rearAxle, [0.075, 0.1, 0.08], [side * 0.71, 0.318, 2.7], steel, 0.01);
    bar(
      rearAxle,
      [side * 0.57, 0.28, 2.15],
      [side * 0.71, 0.28, 2.15],
      0.045,
      rubber,
    );
  }
  const stabilizer = part(
    'front-stabilizer',
    'Front anti-roll bar',
    'suspension',
    [0, -0.43, -0.52],
    4,
    'A torsion bar links the front suspension sides and resists body roll in corners.',
    'Spring steel',
  );
  tube(
    stabilizer,
    [
      [-0.65, 0.27, -0.06],
      [-0.48, 0.24, 0.2],
      [0.48, 0.24, 0.2],
      [0.65, 0.27, -0.06],
    ],
    0.013,
    steel,
  );
  const tank = part(
    'fuel-tank',
    'Fuel tank',
    'fuel',
    [-0.35, -0.57, 0.15],
    5,
    'The moulded fuel tank is protected under the rear seat area, ahead of the rear axle.',
    'Multilayer polymer',
  );
  box(tank, [0.62, 0.17, 0.57], [-0.33, 0.305, 2.23], black, 0.055);
  const straps = part(
    'tank-straps',
    'Fuel-tank retaining straps',
    'fuel',
    [-0.25, -0.84, 0.1],
    4,
    'Steel straps retain the fuel tank against the body.',
  );
  for (const z of [2.04, 2.42])
    box(straps, [0.64, 0.014, 0.025], [-0.33, 0.219, z], steel, 0.006);
  const filler = part(
    'fuel-filler',
    'Fuel filler neck and vent',
    'fuel',
    [-0.62, 0.28, 0.5],
    3,
    'The filler neck joins the left rear fuel door to the tank. A parallel vent allows displaced vapour to return.',
    'Steel / reinforced polymer',
  );
  tube(
    filler,
    [
      [-0.77, 0.91, 2.83],
      [-0.67, 0.56, 2.79],
      [-0.58, 0.4, 2.49],
      [-0.5, 0.35, 2.24],
    ],
    0.022,
    black,
  );
  const pump = part(
    'fuel-pump',
    'In-tank fuel pump and sender',
    'fuel',
    [-0.26, 0.65, 0.1],
    4,
    'The submerged electric pump supplies fuel; the sender measures fuel level.',
    'Polymer and metal',
  );
  mesh(
    pump,
    new THREE.CylinderGeometry(0.06, 0.05, 0.15, 28),
    alloy,
    [-0.31, 0.37, 2.18],
  );
  const fuelLines = part(
    'fuel-lines',
    'Fuel and vapour lines',
    'fuel',
    [-0.4, -0.24, 0.2],
    5,
    'Protected lines connect the rear tank and vapour system to the engine bay.',
    'Coated metal / polymer',
  );
  tube(
    fuelLines,
    [
      [-0.31, 0.29, 2.18],
      [-0.58, 0.24, 1.9],
      [-0.58, 0.24, 0.7],
      [-0.35, 0.42, 0.35],
    ],
    0.006,
    black,
  );
  const exhaust = part(
    'exhaust-pipe',
    'Underfloor exhaust pipe',
    'fuel',
    [0.5, -0.6, 0],
    5,
    'Exhaust gas flows under the central floor tunnel to the rear silencer. Heat shields protect the cabin floor.',
    'Stainless steel',
  );
  tube(
    exhaust,
    [
      [0.19, 0.48, 0.12],
      [0.2, 0.28, 0.35],
      [0.17, 0.19, 0.63],
      [0.03, 0.155, 1.14],
      [0.03, 0.155, 2.57],
      [0.36, 0.2, 2.93],
      [0.36, 0.23, 3.24],
    ],
    0.023,
    alloy,
  );
  const catalyst = part(
    'catalyst',
    'Underfloor catalytic converter',
    'fuel',
    [0.58, -0.47, -0.25],
    4,
    'The catalyst reduces harmful exhaust constituents. This shell represents the underfloor section; exact catalyst internals are not modeled.',
    'Stainless steel / ceramic',
  );
  box(catalyst, [0.135, 0.095, 0.25], [0.16, 0.2, 0.63], alloy, 0.04);
  const muffler = part(
    'muffler',
    'Rear silencer and tailpipe',
    'fuel',
    [0.4, -0.43, 0.83],
    4,
    'Internal chambers attenuate exhaust sound before gas leaves through the outlet.',
    'Stainless steel',
  );
  box(muffler, [0.54, 0.125, 0.3], [0.28, 0.23, 3.19], steel, 0.05);
  tube(
    muffler,
    [
      [0.48, 0.23, 3.18],
      [0.57, 0.23, 3.39],
      [0.57, 0.205, 3.46],
    ],
    0.02,
    steel,
  );
  const heatshield = part(
    'heat-shields',
    'Floor exhaust heat shields',
    'fuel',
    [0.48, -0.26, 0.15],
    3,
    'Thin metal shields provide an air gap between hot exhaust components and the passenger floor.',
    'Embossed aluminium',
  );
  box(heatshield, [0.24, 0.012, 1.76], [0.04, 0.19, 1.7], alloy, 0.018);
  const tray = part(
    'undertray',
    'Engine undertray',
    'body',
    [0, -0.95, -0.23],
    1,
    'The lower splash shield protects the engine bay and smooths underbody airflow.',
    'Moulded polymer',
  );
  box(tray, [1.05, 0.016, 0.8], [0, 0.115, -0.07], black, 0.034);
  const transmission = createVehicleTransmission(k, group);
  batchVehicleModel(group);
  return {
    group,
    materials: k.materials,
    parts: k.parts,
    setWheelAngle(angle: number) {
      shafts.forEach((s) => (s.rotation.x = angle));
      transmission.setWheelAngle(angle);
    },
  };
}
