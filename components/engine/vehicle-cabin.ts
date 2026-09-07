import * as THREE from 'three';
import type { ModelKit, P3 } from './vehicle-model';
import type { CabinMaterials } from './cabin-materials';
import { createCabinSeating } from './cabin-seating';
import { createCabinCockpit } from './cabin-cockpit';
import { createCabinServices } from './cabin-services';

export function createVehicleCabin(
  k: ModelKit,
  group: THREE.Group,
  m: CabinMaterials,
) {
  createCabinSeating(k, group, m);
  createCabinCockpit(k, group, m);
  createCabinServices(k, group, m);
  const { box, mesh, surface, tube, bar, steel } = k;
  const part = (
    id: string,
    name: string,
    offset: P3,
    stage: number,
    description: string,
  ) =>
    k.part(group, {
      id: `car-${id}`,
      name,
      system: id === 'roof-bows' ? 'body' : 'cabin',
      offset,
      stage,
      description,
      material: 'Textile and moulded automotive trim',
    });
  const carpet = part(
    'carpet',
    'Cabin carpet',
    [0, 0.28, 0.1],
    5,
    'The shaped carpet follows the floor, raised centre tunnel and seat mounting points. Separate fitted mats cover the front footwells.',
  );
  surface(
    carpet,
    (u, v) => {
      const x = (u * 2 - 1) * 0.69,
        z = 0.8 + v * 1.83;
      return [x, 0.301 + 0.049 * Math.exp(-Math.pow(x / 0.12, 2)), z];
    },
    m.carpet,
    60,
    80,
  );
  for (const side of [-1, 1]) {
    const mat = part(
      `${side < 0 ? 'driver' : 'passenger'}-floor-mat`,
      `${side < 0 ? 'Driver' : 'Passenger'} floor mat`,
      [side * 0.5, 0.45, -0.12],
      2,
      'A fitted carpet mat covers the footwell while leaving clearance around the pedals and seat rails.',
    );
    box(mat, [0.407, 0.006, 0.43], [side * 0.399, 0.31, 1.02], m.carpet, 0.018);
    const visor = part(
      `${side < 0 ? 'left' : 'right'}-sun-visor`,
      `${side < 0 ? 'Driver' : 'Passenger'} sun visor`,
      [side * 0.4, 1.2, -0.15],
      2,
      'The padded sun visor pivots from the roof header and clips beside the overhead console. A sliding vanity-mirror cover sits on its inner face.',
    );
    const pad = box(
      visor,
      [0.31, 0.019, 0.137],
      [side * 0.343, 1.245, 1.025],
      m.headliner,
      0.019,
    );
    pad.rotation.x = -0.55;
    box(
      visor,
      [0.105, 0.007, 0.065],
      [side * 0.343, 1.229, 1.028],
      m.pale,
      0.006,
    );
    bar(
      visor,
      [side * 0.5, 1.249, 1.027],
      [side * 0.477, 1.271, 1.083],
      0.005,
      m.pale,
    );
    const pillar = part(
      `${side < 0 ? 'left' : 'right'}-pillar-trim`,
      `${side < 0 ? 'Left' : 'Right'} cabin pillar trim`,
      [side * 0.42, 0.55, 0.13],
      3,
      'Light upper A- and C-pillar trim meets the roof lining; the B-pillar carries the shoulder-belt guide with dark lower trim.',
    );
    for (const path of [
      [
        [side * 0.763, 0.898, 0.69],
        [side * 0.652, 1.185, 1.03],
        [side * 0.603, 1.313, 1.28],
      ],
      [
        [side * 0.733, 0.91, 2.65],
        [side * 0.655, 1.15, 2.32],
        [side * 0.615, 1.31, 2.15],
      ],
    ] as P3[][])
      tube(pillar, path, 0.025, m.pale);
    box(
      pillar,
      [0.037, 0.43, 0.074],
      [side * 0.724, 1.059, 1.749],
      m.pale,
      0.016,
    );
    box(
      pillar,
      [0.041, 0.51, 0.082],
      [side * 0.741, 0.586, 1.749],
      m.dark,
      0.018,
    );
    for (const [where, z] of [
      ['front', 1.413],
      ['rear', 2.051],
    ] as const) {
      const grab = part(
        `${side < 0 ? 'left' : 'right'}-${where}-grab-handle`,
        `${side < 0 ? 'Left' : 'Right'} ${where} roof assist grip`,
        [side * 0.48, 1.31, 0.1],
        2,
        'The folding assist grip attaches to the roof-side reinforcement above the door opening.',
      );
      tube(
        grab,
        [
          [side * 0.602, 1.269, z - 0.061],
          [side * 0.572, 1.241, z - 0.061],
          [side * 0.572, 1.241, z + 0.061],
          [side * 0.602, 1.269, z + 0.061],
        ],
        0.008,
        m.pale,
      );
      for (const dz of [-0.063, 0.063])
        box(
          grab,
          [0.026, 0.026, 0.032],
          [side * 0.607, 1.273, z + dz],
          m.pale,
          0.008,
        );
    }
  }
  const headliner = part(
    'headliner',
    'Headliner',
    [0, 1.4, 0.1],
    3,
    'A light woven headliner follows the double curvature of the roof and meets the pillar trim, overhead console and sun visors.',
  );
  surface(
    headliner,
    (u, v) => {
      const z = 1.1 + u * 1.31,
        x = (v * 2 - 1) * 0.619;
      return [x, 1.338 - 0.19 * (z - 1.7) ** 2 - 0.025 * (x / 0.619) ** 2, z];
    },
    m.headliner,
    60,
    52,
  );
  const bows = part(
    'roof-bows',
    'Roof reinforcing bows',
    [0, 1.65, 0.15],
    5,
    'Transverse stamped roof bows connect the roof side rails behind the headliner.',
  );
  for (const z of [1.33, 1.85, 2.22]) {
    const y = 1.354 - 0.19 * (z - 1.7) ** 2;
    tube(
      bows,
      [
        [-0.62, y - 0.026, z],
        [0, y, z],
        [0.62, y - 0.026, z],
      ],
      0.009,
      steel,
    );
  }
  const overhead = part(
    'overhead-console',
    'Overhead lighting console',
    [0, 1.5, -0.22],
    2,
    'The roof console groups map lamps and switches between the sun visors, above the interior mirror.',
  );
  box(overhead, [0.152, 0.035, 0.188], [0, 1.274, 1.149], m.pale, 0.022);
  for (const x of [-0.042, 0.042])
    box(overhead, [0.047, 0.007, 0.051], [x, 1.253, 1.102], m.silver, 0.008);
  for (const x of [-0.039, 0, 0.039])
    box(overhead, [0.026, 0.006, 0.026], [x, 1.25, 1.167], m.soft, 0.004);
  const mirror = part(
    'interior-mirror',
    'Interior rear-view mirror',
    [0, 0.9, -0.3],
    2,
    'The inside mirror mounts below the upper windscreen camera housing on an adjustable stalk.',
  );
  bar(mirror, [0, 1.239, 1.001], [0, 1.156, 1.023], 0.012, m.dark);
  box(mirror, [0.245, 0.073, 0.026], [0, 1.153, 1.044], m.dark, 0.019);
  box(mirror, [0.229, 0.06, 0.002], [0, 1.153, 1.059], m.silver, 0.015);
  const camera = part(
    'windscreen-camera-cover',
    'Windscreen camera housing',
    [0, 1.2, -0.27],
    2,
    'A tapered cover behind the upper windscreen houses the forward-facing driver-assistance camera and its mounting bracket.',
  );
  box(camera, [0.138, 0.062, 0.159], [0, 1.253, 0.982], m.dark, 0.02);
  const shelf = part(
    'parcel-shelf',
    'Rear parcel shelf',
    [0, 0.75, 1.1],
    3,
    'The carpeted rear parcel shelf spans the body beneath the back window, with speaker grilles and the central high-mounted stop lamp.',
  );
  box(shelf, [1.3, 0.03, 0.37], [0, 0.926, 2.75], m.carpet, 0.019);
  for (const x of [-0.431, 0.431]) {
    const grille = mesh(shelf, new THREE.CircleGeometry(0.075, 48), m.soft, [
      x,
      0.943,
      2.718,
    ]);
    grille.rotation.x = -Math.PI / 2;
    for (let j = -5; j <= 5; j++)
      box(
        shelf,
        [0.1 * Math.sqrt(1 - (j / 6) ** 2), 0.001, 0.003],
        [x, 0.945, 2.718 + j * 0.011],
        m.dark,
        0.0005,
      );
  }
}
