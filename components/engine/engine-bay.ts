import * as THREE from 'three';
import type { VehicleSystem } from '../../lib/engine/vehicle-parts';
import { modelKit, batchVehicleModel, type P3 } from './vehicle-model';
export function createEngineBay() {
  const root = new THREE.Group();
  let group = root;
  group.name = 'engine-bay-equipment';
  const k = modelKit();
  const part = (
    id: string,
    name: string,
    system: VehicleSystem,
    offset: P3,
    description: string,
    stage = 3,
  ) =>
    k.part(root, {
      id: `car-${id}`,
      name,
      system,
      offset,
      description,
      stage,
      material: 'Automotive metal, polymer and rubber',
    });
  const { box, tube, bar, mesh, steel, black, rubber, alloy } = k;
  const reservoir = new THREE.MeshStandardMaterial({
    color: '#c9d3cb',
    roughness: 0.5,
    metalness: 0.02,
  });
  const capBlue = new THREE.MeshStandardMaterial({
    color: '#236899',
    roughness: 0.65,
  });
  const materials = [...k.materials, reservoir, capBlue];
  group = part(
    'inner-wings',
    'Inner fenders and strut towers',
    'body',
    [0, 0.1, 0],
    'The inner fenders and reinforced towers carry the front suspension loads into the body.',
    6,
  );
  // Inner wings and strut towers around the complete powertrain.
  for (const side of [-1, 1]) {
    box(group, [0.07, 0.27, 1.05], [side * 0.733, 0.48, -0.03], steel, 0.027);
    mesh(group, new THREE.CylinderGeometry(0.112, 0.156, 0.23, 36), steel, [
      side * 0.59,
      0.622,
      0.06,
    ]);
    mesh(group, new THREE.CylinderGeometry(0.058, 0.064, 0.025, 24), black, [
      side * 0.59,
      0.75,
      0.06,
    ]);
    for (let j = 0; j < 3; j++) {
      const a = (j / 3) * Math.PI * 2;
      box(
        group,
        [0.015, 0.018, 0.015],
        [side * 0.59 + Math.cos(a) * 0.083, 0.747, 0.06 + Math.sin(a) * 0.083],
        alloy,
        0.003,
      );
    }
    tube(
      group,
      [
        [side * 0.72, 0.68, -0.53],
        [side * 0.705, 0.735, 0.15],
        [side * 0.675, 0.765, 0.62],
      ],
      0.014,
      black,
    );
  }
  const cowl = part(
    'cowl',
    'Cowl and windscreen wipers',
    'body',
    [0, 0.7, -0.2],
    'The cowl intake and wiper arms sit below the windscreen.',
    2,
  );
  cowl.position.set(0, 0.105, -0.282);

  // Cowl, cabin intake grille, wiper mechanism and firewall heat insulation.
  box(cowl, [1.39, 0.075, 0.14], [0, 0.807, 0.596], black, 0.012);
  for (let x = -0.64; x <= 0.64; x += 0.035)
    box(cowl, [0.008, 0.007, 0.1], [x, 0.848, 0.6], steel, 0.002);
  for (const x of [-0.44, 0.26])
    tube(
      cowl,
      [
        [x, 0.862, 0.62],
        [x + 0.1, 0.874, 0.66],
        [x + 0.32, 0.888, 0.67],
      ],
      0.007,
      black,
    );
  group = part(
    'firewall-insulation',
    'Firewall insulation',
    'body',
    [0, 0.25, 0.28],
    'A thermal and acoustic barrier separates the engine bay from the cabin.',
    4,
  );
  box(group, [0.65, 0.32, 0.025], [-0.15, 0.528, 0.667], black, 0.015);
  group = part(
    'brake-booster',
    'Brake booster and master cylinder',
    'brakes',
    [-0.65, 0.75, 0.15],
    'The booster assists pedal effort; the master cylinder supplies hydraulic pressure to the brakes.',
  );
  // Brake booster, master cylinder and translucent brake-fluid reservoir.
  const booster = mesh(
    group,
    new THREE.CylinderGeometry(0.106, 0.106, 0.082, 40),
    black,
    [-0.48, 0.582, 0.569],
  );
  booster.rotation.x = Math.PI / 2;
  bar(group, [-0.48, 0.59, 0.555], [-0.48, 0.59, 0.386], 0.031, alloy);
  box(group, [0.106, 0.085, 0.13], [-0.48, 0.668, 0.441], reservoir, 0.024);
  mesh(
    group,
    new THREE.CylinderGeometry(0.033, 0.033, 0.016, 24),
    black,
    [-0.48, 0.719, 0.445],
  );
  for (const x of [-0.51, -0.455])
    tube(
      group,
      [
        [x, 0.582, 0.407],
        [x - 0.02, 0.5, 0.32],
        [x - 0.035, 0.34, 0.25],
      ],
      0.004,
      alloy,
    );
  group = part(
    'fuse-box',
    'Fuse and relay box',
    'electrical',
    [-0.9, 0.65, 0],
    'Fuses protect the circuits and relays switch high-current equipment.',
  );
  // Fuse/relay box, ECU and loom junctions.
  box(group, [0.197, 0.123, 0.239], [-0.579, 0.485, 0.374], black, 0.018);
  box(group, [0.202, 0.018, 0.245], [-0.579, 0.552, 0.374], rubber, 0.012);
  group = part(
    'ecu',
    'Engine control unit',
    'electrical',
    [-0.85, 0.38, 0.28],
    'The ECU processes sensors and controls fuel injection, ignition and electronic throttle.',
  );
  box(group, [0.165, 0.036, 0.165], [-0.465, 0.404, 0.24], alloy, 0.01);
  for (let j = 0; j < 8; j++)
    box(
      group,
      [0.009, 0.015, 0.132],
      [-0.532 + j * 0.019, 0.43, 0.24],
      steel,
      0.002,
    );
  for (const x of [-0.53, -0.45])
    box(group, [0.051, 0.024, 0.04], [x, 0.425, 0.14], black, 0.005);
  group = part(
    'washer-bottle',
    'Windscreen washer reservoir',
    'electrical',
    [0.9, 0.45, -0.2],
    'The reservoir supplies washer fluid through an electric pump and hoses.',
  );
  // Washer filler neck and bottle, A/C plumbing and receiver/drier.
  box(group, [0.135, 0.19, 0.135], [0.65, 0.368, -0.498], reservoir, 0.035);
  tube(
    group,
    [
      [0.65, 0.43, -0.498],
      [0.671, 0.596, -0.507],
      [0.671, 0.638, -0.507],
    ],
    0.024,
    reservoir,
  );
  mesh(
    group,
    new THREE.CylinderGeometry(0.032, 0.032, 0.015, 24),
    capBlue,
    [0.671, 0.651, -0.507],
  );
  group = part(
    'ac-lines',
    'Air-conditioning lines and receiver',
    'climate',
    [0.75, 0.35, -0.45],
    'Refrigerant lines connect the compressor, condenser and evaporator.',
  );
  tube(
    group,
    [
      [0.3, 0.324, -0.11],
      [0.526, 0.361, -0.22],
      [0.57, 0.356, -0.6],
      [-0.52, 0.347, -0.626],
    ],
    0.009,
    alloy,
  );
  tube(
    group,
    [
      [-0.47, 0.54, 0.58],
      [-0.553, 0.446, 0.277],
      [-0.55, 0.361, -0.555],
    ],
    0.012,
    rubber,
  );
  bar(group, [-0.566, 0.33, -0.515], [-0.566, 0.522, -0.515], 0.025, alloy);
  group = part(
    'condenser',
    'A/C condenser',
    'climate',
    [0, 0.35, -1.2],
    'The front heat exchanger rejects heat from the air-conditioning refrigerant.',
  );
  // Condenser and broad radiator shroud in front of the engine's cooling core.
  box(group, [0.64, 0.32, 0.018], [0, 0.465, -0.464], steel, 0.006);
  for (let y = 0.325; y < 0.61; y += 0.013)
    box(group, [0.612, 0.003, 0.023], [0, y, -0.478], alloy, 0.001);
  group = part(
    'radiator-support',
    'Upper radiator support',
    'body',
    [0, 0.6, -0.8],
    'This crossmember supports the cooling pack and hood latch.',
    4,
  );
  box(group, [1.36, 0.056, 0.21], [0, 0.682, -0.61], black, 0.032);
  group = part(
    'intake-snorkel',
    'Fresh-air intake snorkel',
    'powertrain',
    [0.4, 0.9, -0.8],
    'The broad moulded duct feeds outside air into the air-filter housing.',
  );
  // The production bay has a broad intake snorkel crossing the radiator support.
  // Its outlet meets the right-hand airbox, leaving the coil rail unobstructed.
  tube(
    group,
    [
      [-0.365, 0.554, -0.318],
      [-0.43, 0.603, -0.44],
      [-0.34, 0.684, -0.535],
      [0.06, 0.709, -0.561],
      [0.28, 0.696, -0.548],
    ],
    0.046,
    black,
  );
  box(group, [0.2, 0.047, 0.14], [0.3, 0.693, -0.545], black, 0.025);
  // Airbox inlet resonator and the moulded plenum next to the battery.
  box(group, [0.13, 0.065, 0.14], [-0.39, 0.592, -0.235], black, 0.025);
  group = part(
    'battery-cables',
    'Battery cables',
    'electrical',
    [-0.65, 0.7, 0.45],
    'Heavy cables connect the battery to the starter, ground and electrical distribution.',
  );
  box(group, [0.045, 0.03, 0.05], [-0.41, 0.72, 0.405], black, 0.007);
  tube(
    group,
    [
      [-0.41, 0.723, 0.405],
      [-0.55, 0.699, 0.383],
      [-0.61, 0.57, 0.3],
    ],
    0.007,
    black,
  );
  group = part(
    'battery',
    '12-volt battery',
    'electrical',
    [-0.65, 1, 0.45],
    'The lead-acid battery supplies starting current and stabilises the vehicle electrical supply.',
  );
  box(group, [0.242, 0.19, 0.175], [-0.33, 0.605, 0.413], black, 0.012);
  box(group, [0.251, 0.022, 0.18], [-0.33, 0.707, 0.413], black, 0.009);
  for (const x of [-0.424, -0.236])
    mesh(group, new THREE.CylinderGeometry(0.009, 0.012, 0.022, 16), alloy, [
      x,
      0.728,
      0.36,
    ]);
  // Small battery label, retaining clamp and service marks add readable scale.
  box(group, [0.12, 0.002, 0.082], [-0.33, 0.708, 0.413], reservoir, 0.004);
  for (let j = 0; j < 5; j++)
    box(
      group,
      [0.072, 0.003, 0.003],
      [-0.33, 0.711, 0.386 + j * 0.013],
      black,
      0.001,
    );
  box(group, [0.014, 0.013, 0.214], [-0.31, 0.713, 0.405], steel, 0.003);
  group = part(
    'hood-latch',
    'Hood latch and support cushions',
    'body',
    [0, 0.3, -0.9],
    'The latch and rubber stops locate the closed hood.',
    2,
  );
  box(group, [0.08, 0.064, 0.049], [0, 0.65, -0.685], steel, 0.008);
  for (const x of [-0.495, 0.495])
    box(group, [0.07, 0.07, 0.06], [x, 0.645, -0.648], rubber, 0.012);
  group = part(
    'bay-harness',
    'Engine-bay wiring harness',
    'electrical',
    [0.6, 0.8, 0.2],
    'Protected wiring branches connect the sensors, actuators and power distribution.',
  );
  // Bundled harnesses, coolant/heater hoses and low-profile service hardware.
  for (const side of [-1, 1])
    tube(
      group,
      [
        [side * 0.6, 0.522, 0.52],
        [side * 0.42, 0.53, 0.39],
        [side * 0.33, 0.46, 0.19],
        [side * 0.3, 0.39, -0.2],
      ],
      0.016,
      black,
    );
  group = part(
    'heater-hoses',
    'Cabin heater hoses',
    'climate',
    [0.45, 0.6, 0.65],
    'A pair of hoses supplies hot coolant to the cabin heater core.',
  );
  for (const x of [-0.13, 0.13])
    tube(
      group,
      [
        [x, 0.586, 0.625],
        [x + 0.09, 0.53, 0.45],
        [x + 0.11, 0.45, 0.235],
      ],
      0.017,
      rubber,
    );
  group = part(
    'service-lines',
    'Bay service lines',
    'electrical',
    [0.85, 0.3, 0.35],
    'Small protected lines run around the engine and along the inner fenders.',
  );
  tube(
    group,
    [
      [0.52, 0.6, 0.36],
      [0.59, 0.555, 0.265],
      [0.6, 0.48, -0.11],
      [0.365, 0.46, -0.315],
    ],
    0.008,
    black,
  );
  tube(
    group,
    [
      [-0.57, 0.485, 0.4],
      [-0.63, 0.5, 0.15],
      [-0.62, 0.54, -0.2],
      [-0.44, 0.49, -0.355],
    ],
    0.01,
    black,
  );
  group = part(
    'purge-valve',
    'Evaporative purge valve',
    'fuel',
    [0.7, 0.6, 0.4],
    'The valve meters trapped fuel vapour into the engine intake.',
  );
  // Evaporative purge valve and small vacuum lines beside the inlet system.
  box(group, [0.044, 0.064, 0.051], [0.29, 0.548, 0.273], black, 0.008);
  tube(
    group,
    [
      [0.29, 0.567, 0.285],
      [0.255, 0.572, 0.35],
      [0.16, 0.54, 0.32],
    ],
    0.0045,
    rubber,
  );
  batchVehicleModel(root);
  return { group: root, materials, parts: k.parts };
}
