import * as THREE from 'three';
import type { ModelKit, P3 } from './vehicle-model';
import type { CabinMaterials } from './cabin-materials';
import type { VehicleSystem } from '../../lib/engine/vehicle-parts';

// Component arrangement is taken from sedan HVAC and instrument-panel parts
// references. Case contours and harness routing are a reconstruction.
export function createCabinServices(
  k: ModelKit,
  root: THREE.Group,
  m: CabinMaterials,
) {
  const { box, mesh, surface, tube, bar, steel, alloy } = k;
  const part = (
    id: string,
    name: string,
    system: VehicleSystem,
    offset: P3,
    stage: number,
    description: string,
  ) =>
    k.part(root, {
      id: `car-${id}`,
      name,
      system,
      offset,
      stage,
      description,
      material: 'Automotive polymer, aluminium and steel',
    });
  const beam = part(
    'dash-reinforcement',
    'Instrument-panel reinforcement beam',
    'body',
    [0, 0.5, -0.45],
    5,
    'A cross-car steel beam supports the dashboard, steering column and passenger airbag. Brackets connect it to the body and centre tunnel.',
  );
  bar(beam, [-0.69, 0.732, 0.77], [0.69, 0.732, 0.77], 0.027, steel);
  for (const x of [-0.665, -0.39, -0.16, 0.19, 0.665]) {
    box(beam, [0.048, 0.101, 0.043], [x, 0.72, 0.77], steel, 0.005);
    mesh(beam, new THREE.CylinderGeometry(0.008, 0.008, 0.012, 6), alloy, [
      x,
      0.776,
      0.77,
    ]);
  }
  for (const x of [-0.16, 0.17])
    bar(beam, [x, 0.72, 0.77], [x, 0.316, 0.93], 0.014, steel);
  const casePart = part(
    'hvac-case',
    'Heater and evaporator housing',
    'climate',
    [0, 0.3, -0.5],
    4,
    'The central HVAC case houses the evaporator, heater core and air-mixing passages. Removing the case exposes both heat exchangers; the blower supplies air from the passenger side.',
  );
  const profile = new THREE.Shape();
  profile.moveTo(-0.162, 0.375);
  profile.lineTo(0.132, 0.375);
  profile.quadraticCurveTo(0.181, 0.45, 0.169, 0.64);
  profile.lineTo(0.134, 0.783);
  profile.lineTo(-0.135, 0.783);
  profile.quadraticCurveTo(-0.183, 0.6, -0.162, 0.375);
  const g = new THREE.ExtrudeGeometry(profile, {
    depth: 0.232,
    bevelEnabled: true,
    bevelSize: 0.008,
    bevelThickness: 0.007,
    bevelSegments: 3,
  });
  mesh(casePart, g, m.dark, [0, 0, 0.666]);
  for (const side of [-1, 1])
    for (const y of [0.422, 0.534, 0.691]) {
      box(
        casePart,
        [0.025, 0.027, 0.048],
        [side * 0.176, y, 0.794],
        m.soft,
        0.004,
      );
      bar(
        casePart,
        [side * 0.18, y, 0.786],
        [side * 0.18, y, 0.819],
        0.004,
        alloy,
      );
    }
  tube(
    casePart,
    [
      [-0.166, 0.389, 0.793],
      [-0.168, 0.53, 0.9],
      [-0.145, 0.757, 0.9],
      [0.134, 0.757, 0.9],
      [0.166, 0.54, 0.9],
    ],
    0.002,
    m.soft,
  );
  const evap = part(
    'evaporator',
    'A/C evaporator',
    'climate',
    [0.19, 0.57, -0.3],
    3,
    'Cold refrigerant in the evaporator absorbs heat from incoming cabin air. Moisture condenses on the fins and drains through the floor.',
  );
  const heater = part(
    'heater-core',
    'Cabin heater core',
    'climate',
    [-0.2, 0.57, -0.15],
    3,
    'Hot engine coolant passes through this compact finned heat exchanger. Air-mixing doors regulate how much cabin air passes across it.',
  );
  for (const [group, y, z, w, h] of [
    [evap, 0.595, 0.746, 0.24, 0.225],
    [heater, 0.544, 0.854, 0.224, 0.152],
  ] as [THREE.Group, number, number, number, number][]) {
    box(group, [w, h, 0.034], [0, y, z], alloy, 0.006);
    for (let i = 0; i < 33; i++)
      box(
        group,
        [w * 0.92, 0.0014, 0.038],
        [0, y - h * 0.46 + (i * h * 0.92) / 32, z],
        m.silver,
        0.0003,
      );
    for (const x of [-w * 0.48, w * 0.48])
      box(group, [0.018, h, 0.046], [x, y, z], steel, 0.004);
  }
  for (const x of [-0.13, 0.13])
    tube(
      heater,
      [
        [x, 0.548, 0.855],
        [x, 0.555, 0.714],
        [x, 0.586, 0.625],
      ],
      0.009,
      alloy,
    );
  for (const x of [0.062, 0.1])
    tube(
      evap,
      [
        [x, 0.701, 0.746],
        [x, 0.729, 0.696],
        [x, 0.681, 0.645],
      ],
      0.007,
      alloy,
    );
  const drain = part(
    'evaporator-drain',
    'Evaporator drain hose',
    'climate',
    [0.23, -0.05, 0.22],
    4,
    'The drain carries condensed water from the bottom of the HVAC case through a sealed floor grommet.',
  );
  tube(
    drain,
    [
      [0.121, 0.396, 0.731],
      [0.146, 0.344, 0.72],
      [0.137, 0.265, 0.761],
    ],
    0.006,
    m.dark,
  );
  const blowerCase = part(
    'blower-housing',
    'Cabin blower housing',
    'climate',
    [0.57, 0.4, -0.15],
    4,
    'A scroll-shaped housing surrounds the centrifugal blower on the passenger side and directs air into the central HVAC case.',
  );
  const cx = 0.378,
    cy = 0.584,
    cz = 0.778;
  surface(
    blowerCase,
    (u, v) => {
      const a = u * Math.PI * 2,
        r = 0.106 + 0.03 * u;
      return [
        cx + Math.cos(a) * r,
        cy + (v - 0.5) * 0.17,
        cz + Math.sin(a) * r,
      ];
    },
    m.dark,
    96,
    18,
  );
  mesh(
    blowerCase,
    new THREE.CylinderGeometry(0.112, 0.112, 0.009, 64),
    m.dark,
    [cx, cy + 0.088, cz],
  );
  box(blowerCase, [0.173, 0.12, 0.115], [0.224, 0.588, 0.771], m.dark, 0.026);
  const motor = part(
    'blower-motor',
    'Cabin blower motor and fan',
    'climate',
    [0.62, 0.03, 0.16],
    3,
    'The electric motor turns a squirrel-cage impeller. Closely spaced curved vanes draw air through the filter and discharge it radially into the scroll housing.',
  );
  mesh(motor, new THREE.CylinderGeometry(0.06, 0.062, 0.057, 48), steel, [
    cx,
    0.476,
    cz,
  ]);
  for (const y of [0.527, 0.628])
    mesh(motor, new THREE.CylinderGeometry(0.095, 0.095, 0.004, 64), m.soft, [
      cx,
      y,
      cz,
    ]);
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    surface(
      motor,
      (u, v) => {
        const b = a + u * 0.13,
          r = 0.077 + u * 0.015;
        return [cx + Math.cos(b) * r, 0.529 + v * 0.096, cz + Math.sin(b) * r];
      },
      m.soft,
      4,
      8,
    );
  }
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    box(
      motor,
      [0.028, 0.008, 0.029],
      [cx + Math.cos(a) * 0.086, 0.499, cz + Math.sin(a) * 0.086],
      m.dark,
      0.005,
    );
  }
  const filter = part(
    'cabin-filter',
    'Cabin air filter',
    'climate',
    [0.62, 0.7, -0.1],
    2,
    'A pleated cabin filter sits above the passenger-side blower, behind the glove compartment. Air passes through it before entering the HVAC unit.',
  );
  box(filter, [0.191, 0.029, 0.195], [0.376, 0.725, 0.76], m.pale, 0.004);
  for (let i = 0; i < 27; i++)
    box(
      filter,
      [0.173, 0.007, 0.0018],
      [0.376, 0.743, 0.671 + i * 0.0066],
      m.headliner,
      0.0004,
    );
  const filterCover = part(
    'cabin-filter-cover',
    'Cabin filter access cover',
    'climate',
    [0.56, 0.51, 0.2],
    1,
    'The narrow clipped cover closes the filter slot behind the glovebox. It can be removed independently to expose the filter.',
  );
  const filterTray = part(
    'cabin-filter-tray',
    'Cabin air-filter tray',
    'climate',
    [0.63, 0.55, 0.18],
    3,
    'The removable carrier supports the filter behind the glovebox. Its perimeter frame and guide rails slide into the intake housing after the access cover is released.',
  );
  for (const x of [0.275, 0.477])
    box(filterTray, [0.009, 0.026, 0.202], [x, 0.719, 0.76], m.dark, 0.002);
  for (const z of [0.657, 0.863])
    box(filterTray, [0.21, 0.026, 0.008], [0.376, 0.719, z], m.dark, 0.002);
  for (const x of [0.304, 0.351, 0.4, 0.45])
    box(filterTray, [0.006, 0.004, 0.2], [x, 0.704, 0.76], m.dark, 0.001);
  box(filterCover, [0.205, 0.031, 0.013], [0.376, 0.727, 0.865], m.dark, 0.004);
  for (const x of [0.278, 0.474])
    box(filterCover, [0.014, 0.042, 0.02], [x, 0.727, 0.87], m.soft, 0.003);
  const intake = part(
    'hvac-intake',
    'Fresh-air and recirculation intake',
    'climate',
    [0.59, 0.8, -0.25],
    3,
    'The upper intake admits outside air from the cowl or recirculated cabin air. Its flap selects the air source above the filter.',
  );
  box(intake, [0.207, 0.09, 0.202], [0.376, 0.789, 0.756], m.dark, 0.018);
  for (let i = 0; i < 10; i++)
    box(
      intake,
      [0.165, 0.004, 0.006],
      [0.376, 0.838, 0.681 + i * 0.016],
      m.soft,
      0.001,
    );
  const ducts = part(
    'dashboard-ducts',
    'Dashboard outlet ducts',
    'climate',
    [0, 0.94, -0.35],
    3,
    'Moulded branches connect the central distributor to both outer vents and the centre outlets. The branches sit behind the visible dashboard fascia.',
  );
  for (const side of [-1, 1]) {
    tube(
      ducts,
      [
        [side * 0.1, 0.764, 0.8],
        [side * 0.22, 0.815, 0.851],
        [side * 0.44, 0.794, 0.873],
        [side * 0.613, 0.799, 0.921],
      ],
      0.034,
      m.dark,
    );
    tube(
      ducts,
      [
        [side * 0.049, 0.76, 0.803],
        [side * 0.061, 0.811, 0.889],
        [side * 0.069, 0.811, 0.984],
      ],
      0.025,
      m.dark,
    );
  }
  const demist = part(
    'defroster-duct',
    'Windscreen demister duct',
    'climate',
    [0, 1.12, -0.55],
    3,
    'A separate upper duct distributes demisting air along the base of the windscreen.',
  );
  tube(
    demist,
    [
      [0, 0.754, 0.777],
      [0, 0.827, 0.74],
      [0, 0.853, 0.702],
    ],
    0.028,
    m.dark,
  );
  tube(
    demist,
    [
      [-0.545, 0.851, 0.727],
      [0, 0.86, 0.703],
      [0.545, 0.851, 0.727],
    ],
    0.022,
    m.dark,
  );
  const foot = part(
    'footwell-ducts',
    'Front and rear footwell ducts',
    'climate',
    [0, -0.2, 0.6],
    5,
    'Lower outlets warm the front footwells; floor-level branches carry air beneath the front seats to the rear passengers.',
  );
  for (const side of [-1, 1]) {
    tube(
      foot,
      [
        [side * 0.11, 0.421, 0.79],
        [side * 0.22, 0.354, 0.909],
        [side * 0.29, 0.349, 0.95],
      ],
      0.025,
      m.dark,
    );
    box(
      foot,
      [0.087, 0.039, 0.84],
      [side * 0.157, 0.329, 1.455],
      m.dark,
      0.012,
    );
    box(
      foot,
      [0.135, 0.045, 0.095],
      [side * 0.199, 0.33, 1.845],
      m.dark,
      0.012,
    );
  }
  const harness = part(
    'instrument-harness',
    'Instrument-panel wiring harness',
    'electrical',
    [0, 0.64, -0.1],
    4,
    'The cross-car harness connects the cluster, centre display, climate panel and body electronics. Branches and connectors follow the dashboard reinforcement, separate from the air ducts.',
  );
  tube(
    harness,
    [
      [-0.665, 0.709, 0.821],
      [-0.478, 0.693, 0.824],
      [-0.23, 0.695, 0.816],
      [0.06, 0.699, 0.814],
      [0.365, 0.697, 0.831],
      [0.631, 0.71, 0.824],
    ],
    0.009,
    m.dark,
  );
  for (const x of [-0.56, -0.37, 0, 0.17, 0.41, 0.6]) {
    tube(
      harness,
      [
        [x, 0.699, 0.824],
        [x, 0.74, 0.897],
        [x, 0.78, 0.944],
      ],
      0.0045,
      m.dark,
    );
    box(harness, [0.028, 0.018, 0.027], [x, 0.778, 0.944], m.pale, 0.004);
  }
  const bodyLoom = part(
    'cabin-floor-harness',
    'Body floor wiring harness',
    'electrical',
    [-0.38, 0.21, 0.52],
    5,
    'Protected wiring runs beside the sill and branches to the seats, rear body and fuel-pump module. Mounting clips keep it separate from the exhaust tunnel.',
  );
  for (const side of [-1, 1]) {
    tube(
      bodyLoom,
      [
        [side * 0.63, 0.68, 0.75],
        [side * 0.65, 0.33, 1],
        [side * 0.66, 0.315, 1.82],
        [side * 0.6, 0.351, 2.37],
        [side * 0.67, 0.7, 2.75],
      ],
      0.006,
      m.dark,
    );
    tube(
      bodyLoom,
      [
        [side * 0.655, 0.318, 1.46],
        [side * 0.43, 0.319, 1.48],
        [side * 0.32, 0.37, 1.48],
      ],
      0.004,
      m.dark,
    );
  }
  const airbag = part(
    'passenger-airbag',
    'Passenger airbag module',
    'cabin',
    [0.32, 0.85, -0.33],
    3,
    'The folded passenger-airbag pack and metal inflator mount to the reinforcement beam beneath the upper dashboard. Deployment is not simulated.',
  );
  box(airbag, [0.249, 0.067, 0.114], [0.375, 0.79, 0.791], m.pale, 0.022);
  bar(airbag, [0.264, 0.75, 0.784], [0.485, 0.75, 0.784], 0.027, steel);
}
