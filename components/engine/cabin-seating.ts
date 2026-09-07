import * as THREE from 'three';
import type { ModelKit, P3 } from './vehicle-model';
import type { CabinMaterials } from './cabin-materials';

export function createCabinSeating(
  k: ModelKit,
  root: THREE.Group,
  m: CabinMaterials,
) {
  const { box, mesh, surface, tube, bar, steel, alloy } = k;
  const part = (
    id: string,
    name: string,
    offset: P3,
    stage: number,
    description: string,
  ) =>
    k.part(root, {
      id: `car-${id}`,
      name,
      system: 'cabin',
      offset,
      stage,
      description,
      material: 'Woven fabric, moulded foam and steel',
    });
  const bands: [number, number, THREE.Material][] = [
    [-1, -0.63, m.bolster],
    [-0.63, 0.63, m.cloth],
    [0.63, 1, m.bolster],
  ];
  // Upholstery follows a continuous shaped foam surface, including rolled
  // front edges and side bolsters; colour boundaries do not stack boxes.
  function frontSeat(x: number, side: number) {
    const id = side < 0 ? 'driver' : 'passenger',
      label = side < 0 ? 'Driver' : 'Front passenger';
    const rails = part(
      `${id}-seat-rails`,
      `${label} seat rails`,
      [side * 0.58, -0.16, 0],
      5,
      'Two sliding steel tracks and bolted feet support the seat frame. The front release bar unlocks both runners for adjustment.',
    );
    for (const dx of [-0.15, 0.15]) {
      box(rails, [0.033, 0.027, 0.49], [x + dx, 0.312, 1.275], steel, 0.006);
      box(rails, [0.022, 0.021, 0.39], [x + dx, 0.337, 1.3], alloy, 0.004);
      for (const z of [1.06, 1.49]) {
        box(rails, [0.064, 0.013, 0.058], [x + dx, 0.299, z], steel, 0.004);
        mesh(rails, new THREE.CylinderGeometry(0.009, 0.009, 0.009, 6), alloy, [
          x + dx,
          0.31,
          z,
        ]);
      }
      bar(rails, [x + dx, 0.342, 1.12], [x + dx, 0.397, 1.22], 0.015, steel);
    }
    tube(
      rails,
      [
        [x - 0.15, 0.349, 1.12],
        [x - 0.15, 0.36, 1.01],
        [x + 0.15, 0.36, 1.01],
        [x + 0.15, 0.349, 1.12],
      ],
      0.007,
      m.dark,
    );
    const cushion = part(
      `${id}-seat`,
      `${label} seat cushion`,
      [side * 0.61, 0.87, 0],
      3,
      'The two-tone cloth cushion has a dark centre insert, light woven side bolsters and a rolled front edge over a contoured foam pad.',
    );
    const top = (u: number, v: number): P3 => {
      const z = 0.995 + v * 0.535;
      const width = 0.209 + 0.015 * Math.sin(Math.PI * v) - 0.036 * v ** 4;
      const edge = Math.abs(u),
        rounded = Math.sqrt(Math.max(0, 1 - edge ** 10));
      const frontRoll = 0.028 * Math.exp(-Math.pow((v - 0.04) / 0.105, 2));
      const bolster =
        0.045 *
        Math.exp(-Math.pow((edge - 0.8) / 0.18, 2)) *
        Math.sin(Math.PI * (0.17 + 0.7 * v));
      return [
        x + u * width,
        0.425 + 0.046 * rounded + bolster - frontRoll - 0.025 * v * v,
        z,
      ];
    };
    for (const [a, b, mat] of bands)
      surface(
        cushion,
        (u, v) => top(THREE.MathUtils.lerp(a, b, u), v),
        mat,
        28,
        56,
      );
    surface(
      cushion,
      (u, v) => {
        const p = top(u * 2 - 1, 0);
        return [
          p[0],
          THREE.MathUtils.lerp(0.362, p[1], v),
          p[2] - 0.012 * Math.sin(v * Math.PI),
        ];
      },
      m.bolster,
      52,
      16,
    );
    for (const side2 of [-1, 1])
      surface(
        cushion,
        (u, v) => {
          const p = top(side2, u);
          return [
            p[0] +
              side2 * 0.008 * Math.sin(v * Math.PI) * Math.sin(u * Math.PI),
            THREE.MathUtils.lerp(p[1], 0.362, v),
            p[2],
          ];
        },
        m.bolster,
        52,
        16,
      );
    surface(
      cushion,
      (u, v) => {
        const p = top(u * 2 - 1, 1);
        return [p[0], THREE.MathUtils.lerp(p[1], 0.362, v), p[2]];
      },
      m.dark,
      48,
      12,
    );
    surface(
      cushion,
      (u, v) => {
        const p = top(u * 2 - 1, v);
        return [p[0], 0.362, p[2]];
      },
      m.dark,
      40,
      40,
    );
    box(cushion, [0.384, 0.029, 0.46], [x, 0.364, 1.265], m.dark, 0.014);
    box(
      cushion,
      [0.039, 0.076, 0.35],
      [x + side * 0.226, 0.39, 1.3],
      m.dark,
      0.018,
    );
    box(
      cushion,
      [0.045, 0.018, 0.13],
      [x + side * 0.244, 0.402, 1.31],
      m.dark,
      0.006,
    );
    const recline = mesh(
      cushion,
      new THREE.CylinderGeometry(0.032, 0.032, 0.016, 32),
      m.dark,
      [x + side * 0.23, 0.413, 1.48],
    );
    recline.rotation.z = Math.PI / 2;
    for (const u of [-0.63, 0.63])
      tube(
        cushion,
        Array.from({ length: 45 }, (_, i) => {
          const p = top(u, i / 44);
          p[1] += 0.0009;
          return p;
        }),
        0.00065,
        m.stitch,
      );

    const back = part(
      `${id}-seatback`,
      `${label} seat back`,
      [side * 0.62, 0.94, 0.44],
      3,
      'The shaped backrest carries a dark patterned centre panel between light bolsters. Its padded shoulders taper toward the separate height-adjustable head restraint.',
    );
    const front = (u: number, v: number): P3 => {
      const width =
        0.193 +
        0.027 * Math.sin(v * Math.PI) -
        0.049 * THREE.MathUtils.smoothstep(v, 0.68, 1);
      const y = 0.469 + 0.55 * v - 0.022 * Math.abs(u) ** 4;
      const z =
        1.499 +
        0.15 * v -
        0.025 * Math.sin(v * Math.PI) -
        0.053 *
          Math.exp(-Math.pow((Math.abs(u) - 0.78) / 0.2, 2)) *
          Math.sin(Math.PI * (0.13 + 0.76 * v));
      return [x + u * width, y, z];
    };
    for (const [a, b, mat] of bands)
      surface(
        back,
        (u, v) => front(THREE.MathUtils.lerp(a, b, u), v),
        mat,
        32,
        64,
      );
    surface(
      back,
      (u, v) => {
        const p = front(u * 2 - 1, v);
        return [p[0], p[1], p[2] + 0.09 - 0.035 * Math.abs(u * 2 - 1) ** 4];
      },
      m.dark,
      64,
      48,
    );
    for (const edge of [-1, 1])
      surface(
        back,
        (u, v) => {
          const p = front(edge, u);
          return [
            p[0] + edge * 0.012 * Math.sin(v * Math.PI) * Math.sin(u * Math.PI),
            p[1],
            p[2] + v * 0.055,
          ];
        },
        m.bolster,
        60,
        20,
      );
    for (const end of [0, 1])
      surface(
        back,
        (u, v) => {
          const p = front(u * 2 - 1, end);
          return [
            p[0],
            p[1] + (end ? 1 : -1) * 0.012 * Math.sin(v * Math.PI),
            p[2] + v * (0.09 - 0.035 * Math.abs(u * 2 - 1) ** 4),
          ];
        },
        end ? m.cloth : m.dark,
        48,
        16,
      );
    for (const u of [-0.63, 0.63])
      tube(
        back,
        Array.from({ length: 50 }, (_, i) => {
          const p = front(u, i / 49);
          p[2] -= 0.001;
          return p;
        }),
        0.00075,
        m.stitch,
      );
    // Restrained diagonal quilting follows the front cloth surface.
    for (let j = -3; j < 9; j++) {
      const pts: P3[] = [];
      for (let i = 0; i <= 45; i++) {
        const u = -0.6 + (1.2 * i) / 45,
          v = 0.12 + j * 0.105 + 0.17 * (u + 0.6);
        if (v > 0.08 && v < 0.88) {
          const p = front(u, v);
          p[2] -= 0.0008;
          pts.push(p);
        }
      }
      if (pts.length > 1) tube(back, pts, 0.00028, m.stitch);
    }
    box(back, [0.265, 0.18, 0.006], [x, 0.685, 1.655], m.dark, 0.025);
    tube(
      back,
      [
        [x - 0.13, 0.775, 1.661],
        [x, 0.774, 1.6],
        [x + 0.13, 0.775, 1.661],
      ],
      0.0012,
      m.stitch,
    );
    const head = part(
      `${id}-headrest`,
      `${label} head restraint`,
      [side * 0.61, 1.4, 0.48],
      2,
      'The contoured cloth head restraint has two metal adjustment posts, a curved front pad and stitched perimeter.',
    );
    for (const dx of [-0.061, 0.061]) {
      bar(head, [x + dx, 0.993, 1.661], [x + dx, 1.086, 1.671], 0.006, alloy);
      box(head, [0.026, 0.013, 0.024], [x + dx, 1.013, 1.658], m.dark, 0.006);
    }
    const pad = box(
      head,
      [0.25, 0.205, 0.11],
      [x, 1.104, 1.664],
      m.cloth,
      0.045,
    );
    pad.rotation.x = 0.13;
    const seam: P3[] = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      seam.push([
        x + 0.112 * Math.sign(Math.cos(a)) * Math.abs(Math.cos(a)) ** 0.65,
        1.104 + 0.09 * Math.sign(Math.sin(a)) * Math.abs(Math.sin(a)) ** 0.65,
        1.602 + 0.012 * Math.sin(a),
      ]);
    }
    tube(head, seam, 0.0008, m.stitch);
    const belt = part(
      `${id}-belt`,
      `${label} seat belt`,
      [side * 0.86, 0.26, 0.22],
      4,
      'The stowed three-point webbing runs down the B-pillar through the height-adjustable shoulder guide to its lower anchor. The buckle sits beside the centre console.',
    );
    const beltPath = new THREE.CatmullRomCurve3(
      [
        [side * 0.755, 1.178, 1.75],
        [side * 0.749, 0.84, 1.75],
        [side * 0.724, 0.51, 1.7],
        [side * 0.704, 0.34, 1.64],
      ].map((p) => new THREE.Vector3(...p)),
    );
    surface(
      belt,
      (u, v) => {
        const p = beltPath.getPoint(v);
        return [p.x + (u - 0.5) * 0.045, p.y, p.z];
      },
      m.dark,
      4,
      48,
    );
    box(
      belt,
      [0.043, 0.069, 0.025],
      [side * 0.754, 1.168, 1.735],
      m.dark,
      0.01,
    );
    box(belt, [0.034, 0.055, 0.023], [side * 0.73, 0.575, 1.702], alloy, 0.005);
    bar(
      belt,
      [side * 0.16, 0.35, 1.49],
      [side * 0.16, 0.474, 1.445],
      0.012,
      m.dark,
    );
    const buckle = box(
      belt,
      [0.043, 0.062, 0.037],
      [side * 0.16, 0.485, 1.443],
      m.dark,
      0.009,
    );
    buckle.rotation.x = -0.18;
    box(belt, [0.034, 0.012, 0.028], [side * 0.16, 0.516, 1.438], m.red, 0.004);
  }
  frontSeat(-0.375, -1);
  frontSeat(0.375, 1);
  const bench = part(
    'rear-seat',
    'Rear bench cushion',
    [0, 0.85, 1.4],
    3,
    'The rear bench has two contoured outer positions, a narrower centre position and coordinated light bolsters with dark cloth inserts.',
  );
  const benchTop = (u: number, v: number): P3 => [
    u * 0.638,
    0.422 +
      0.069 * Math.sqrt(Math.max(0, 1 - u ** 10)) +
      0.012 * Math.cos(u * Math.PI * 3) -
      0.016 * Math.sin(v * Math.PI),
    2.02 + v * 0.467,
  ];
  for (const [a, b, mat] of [
    [-1, -0.9, m.bolster],
    [-0.9, -0.28, m.cloth],
    [-0.28, 0.28, m.bolster],
    [0.28, 0.9, m.cloth],
    [0.9, 1, m.bolster],
  ] as [number, number, THREE.Material][])
    surface(
      bench,
      (u, v) => benchTop(THREE.MathUtils.lerp(a, b, u), v),
      mat,
      32,
      40,
    );
  surface(
    bench,
    (u, v) => {
      const p = benchTop(u * 2 - 1, 0);
      return [
        p[0],
        THREE.MathUtils.lerp(0.36, p[1], v),
        p[2] - 0.016 * Math.sin(v * Math.PI),
      ];
    },
    m.bolster,
    72,
    16,
  );
  const rearBack = part(
    'rear-seatback',
    'Rear seat back',
    [0, 1.05, 1.5],
    3,
    'The 60/40 split folding rear backrest has outer cloth inserts and a centre seating position. It separates the cabin from the luggage compartment.',
  );
  for (const [x, w] of [
    [-0.218, 0.825],
    [0.418, 0.407],
  ]) {
    const p = box(
      rearBack,
      [w, 0.465, 0.109],
      [x, 0.718, 2.473],
      m.bolster,
      0.034,
    );
    p.rotation.x = 0.17;
  }
  surface(
    rearBack,
    (u, v) => {
      const y = 0.495 + 0.435 * v;
      return [(u * 2 - 1) * 0.625, y, 2.53 + (y - 0.718) * 0.1717];
    },
    m.carpet,
    72,
    40,
  );
  for (const x of [-0.41, 0.41]) {
    const p = box(
      rearBack,
      [0.36, 0.393, 0.019],
      [x, 0.712, 2.4],
      m.cloth,
      0.026,
    );
    p.rotation.x = 0.17;
  }
  for (const x of [-0.4, 0, 0.4]) {
    const head = part(
      `rear-headrest-${x}`,
      `${x < 0 ? 'Left' : x > 0 ? 'Right' : 'Centre'} rear head restraint`,
      [x, 1.4, 1.55],
      2,
      'A padded adjustable head restraint supports the rear seating position.',
    );
    for (const dx of [-0.051, 0.051])
      bar(head, [x + dx, 0.917, 2.505], [x + dx, 1.005, 2.51], 0.0055, alloy);
    box(
      head,
      [x === 0 ? 0.191 : 0.222, 0.145, 0.09],
      [x, 1.029, 2.51],
      m.cloth,
      0.033,
    );
    const belt = part(
      `rear-belt-${x}`,
      `${x < 0 ? 'Left' : x > 0 ? 'Right' : 'Centre'} rear seat belt`,
      [x, 1.1, 1.35],
      4,
      'Rear three-point seat-belt webbing, guide and buckle secure this seating position.',
    );
    const sx = x === 0 ? -0.04 : Math.sign(x) * 0.625;
    surface(
      belt,
      (u, v) => [sx + (u - 0.5) * 0.039, 0.99 - v * 0.51, 2.5 - v * 0.066],
      m.dark,
      4,
      30,
    );
    box(belt, [0.032, 0.044, 0.025], [x + 0.14, 0.496, 2.395], m.dark, 0.005);
    box(belt, [0.026, 0.009, 0.02], [x + 0.14, 0.52, 2.392], m.red, 0.003);
  }
}
