import * as THREE from 'three';
import { modelKit, batchVehicleModel, type P3 } from './vehicle-model';
import { VEHICLE_DIMENSIONS as D } from '../../lib/engine/vehicle-dimensions';
export function createVehicleBody() {
  const group = new THREE.Group();
  group.name = 'corolla-reference-body';
  const k = modelKit();
  const {
    box,
    tube,
    surface,
    bar,
    mesh,
    paint,
    black,
    glass,
    alloy,
    led,
    red,
  } = k;
  paint.side = THREE.DoubleSide;
  const rear = D.length - D.frontOverhang,
    front = -D.frontOverhang;
  function upper(z: number) {
    if (z <= 0.65)
      return THREE.MathUtils.lerp(0.674, 0.901, (z - front) / (0.65 - front));
    if (z <= 2.862) return 0.901;
    return THREE.MathUtils.lerp(0.901, 0.642, (z - 2.862) / (rear - 2.862));
  }
  function width(z: number) {
    return (
      D.width / 2 -
      0.055 *
        Math.pow(Math.abs((z - (rear + front) / 2) / ((rear - front) / 2)), 6)
    );
  }
  for (const side of [-1, 1]) {
    // Close the fender shoulders between the side skin and the hood aperture.
    surface(
      group,
      (u, v) => {
        const z = front + u * (0.65 - front);
        const inner = THREE.MathUtils.lerp(0.8125, 0.8325, u);
        return [
          side * THREE.MathUtils.lerp(inner, width(z), v),
          upper(z) + 0.012 * Math.sin(v * Math.PI),
          z,
        ];
      },
      paint,
      60,
      8,
    );
    surface(
      group,
      (u, v) => {
        const z = 2.862 + u * (rear - 2.862);
        return [side * THREE.MathUtils.lerp(0.85, width(z), v), upper(z), z];
      },
      paint,
      30,
      8,
    );
    surface(
      group,
      (u, v) => {
        const z = front + u * (rear - front);
        let bottom = 0.205;
        for (const axle of [0, D.wheelbase])
          if (Math.abs(z - axle) < 0.37)
            bottom = 0.275 + Math.sqrt(0.37 ** 2 - (z - axle) ** 2);
        const y = THREE.MathUtils.lerp(
          bottom,
          Math.max(bottom + 0.03, upper(z)),
          v,
        );
        return [
          side *
            (width(z) - 0.055 * (1 - v) ** 2 + 0.008 * Math.sin(v * Math.PI)),
          y,
          z,
        ];
      },
      paint,
      200,
      18,
    );
    for (const z of [0, D.wheelbase]) {
      const arch: P3[] = [];
      for (let i = 0; i <= 44; i++) {
        const a = (Math.PI * i) / 44;
        arch.push([
          side * 0.886,
          0.275 + Math.sin(a) * 0.37,
          z - Math.cos(a) * 0.37,
        ]);
      }
      tube(group, arch, 0.012, paint);
    }
    // Slim A/C pillars, dark B pillar and two separate window apertures.
    tube(
      group,
      [
        [side * 0.847, 0.885, 0.65],
        [side * 0.756, 1.12, 0.88],
        [side * 0.674, 1.365, 1.2],
        [side * 0.667, 1.414, 1.59],
        [side * 0.675, 1.39, 2.13],
        [side * 0.86, 0.895, 2.87],
      ],
      0.025,
      paint,
    );
    const windowPanel = (p: P3[]) =>
      surface(
        group,
        (u, v) => {
          const a = new THREE.Vector3(...p[0]).lerp(
              new THREE.Vector3(...p[1]),
              u,
            ),
            b = new THREE.Vector3(...p[2]).lerp(new THREE.Vector3(...p[3]), u);
          return a.lerp(b, v).toArray() as P3;
        },
        glass,
        16,
        10,
      );
    windowPanel([
      [side * 0.843, 0.918, 0.75],
      [side * 0.865, 0.916, 1.78],
      [side * 0.691, 1.348, 1.235],
      [side * 0.687, 1.369, 1.78],
    ]);
    windowPanel([
      [side * 0.865, 0.918, 1.835],
      [side * 0.851, 0.92, 2.71],
      [side * 0.688, 1.369, 1.835],
      [side * 0.697, 1.338, 2.145],
    ]);
    tube(
      group,
      [
        [side * 0.866, 0.91, 1.805],
        [side * 0.686, 1.392, 1.805],
      ],
      0.025,
      black,
    );
    tube(
      group,
      [
        [side * 0.848, 0.901, 0.72],
        [side * 0.876, 0.895, 1.77],
        [side * 0.852, 0.899, 2.77],
      ],
      0.009,
      alloy,
    );
    for (const z of [0.69, 1.805, 2.78])
      tube(
        group,
        [
          [side * 0.89, 0.847, z],
          [side * 0.894, 0.53, z + 0.005],
          [side * 0.857, 0.249, z - 0.025],
        ],
        0.0025,
        black,
      );
    for (const z of [1.56, 2.42]) {
      box(group, [0.018, 0.03, 0.132], [side * 0.902, 0.786, z], paint, 0.012);
      box(group, [0.014, 0.007, 0.09], [side * 0.913, 0.787, z], alloy, 0.003);
    }
    box(group, [0.048, 0.07, 0.07], [side * 0.887, 0.937, 0.79], black, 0.019);
    box(group, [0.15, 0.087, 0.14], [side * 0.989, 0.953, 0.825], paint, 0.038);
    box(group, [0.132, 0.058, 0.011], [side * 0.998, 0.95, 0.886], glass, 0.02);
    // Corolla-style swept lamp signature and a large lower grille.
    box(
      group,
      [0.39, 0.08, 0.06],
      [side * 0.628, 0.654, front + 0.01],
      black,
      0.018,
    );
    tube(
      group,
      [
        [side * 0.43, 0.671, front - 0.023],
        [side * 0.66, 0.683, front + 0.008],
        [side * 0.819, 0.733, front + 0.07],
      ],
      0.008,
      led,
    );
    for (const x of [0.5, 0.62, 0.74])
      box(
        group,
        [0.06, 0.035, 0.017],
        [side * x, 0.644, front - 0.025],
        led,
        0.007,
      );
    box(
      group,
      [0.14, 0.095, 0.025],
      [side * 0.731, 0.349, front + 0.013],
      black,
      0.022,
    );
    tube(
      group,
      [
        [side * 0.4, 0.665, rear + 0.01],
        [side * 0.67, 0.666, rear - 0.016],
        [side * 0.855, 0.689, rear - 0.17],
      ],
      0.012,
      red,
    );
    tube(
      group,
      [
        [side * 0.55, 0.642, rear + 0.013],
        [side * 0.82, 0.65, rear - 0.05],
      ],
      0.006,
      red,
    );
    box(
      group,
      [0.49, 0.035, 0.06],
      [side * 0.47, 0.217, rear - 0.015],
      black,
      0.014,
    );
  }
  // Roof and windshields follow the sedan's low cabin silhouette.
  surface(
    group,
    (u, v) => {
      const z = 1.17 + u * 1.035,
        x = (v - 0.5) * 1.37;
      return [
        x,
        1.399 +
          0.031 * Math.sin(v * Math.PI) -
          0.035 * (Math.abs(u - 0.5) * 2) ** 4,
        z,
      ];
    },
    paint,
    36,
    30,
  );
  surface(
    group,
    (u, v) => {
      const x = (v - 0.5) * THREE.MathUtils.lerp(1.666, 1.37, u);
      return [
        x,
        THREE.MathUtils.lerp(0.898, 1.367, u) + 0.012 * Math.sin(v * Math.PI),
        THREE.MathUtils.lerp(0.638, 1.185, u),
      ];
    },
    glass,
    20,
    26,
  );
  surface(
    group,
    (u, v) => [
      (v - 0.5) * THREE.MathUtils.lerp(1.365, 1.69, u),
      THREE.MathUtils.lerp(1.373, 0.895, u),
      THREE.MathUtils.lerp(2.195, 2.864, u),
    ],
    glass,
    20,
    26,
  );
  surface(
    group,
    (u, v) => {
      const z = 2.862 + u * (rear - 2.862),
        x = (v - 0.5) * 1.73;
      return [
        x,
        THREE.MathUtils.lerp(0.887, 0.625, u) + 0.019 * Math.sin(v * Math.PI),
        z,
      ];
    },
    paint,
    24,
    26,
  );
  // Hood is a real hinged surface with its own inner reinforcement and latch.
  const hood = new THREE.Group();
  hood.position.set(0, 0.872, 0.623);
  group.add(hood);
  surface(
    hood,
    (u, v) => {
      const z = front + 0.042 + u * (0.611 - front),
        x = (v - 0.5) * THREE.MathUtils.lerp(1.625, 1.665, u);
      return [
        x,
        THREE.MathUtils.lerp(0.659, 0.884, u) +
          0.035 * Math.sin(v * Math.PI) -
          0.872,
        z - 0.623,
      ];
    },
    paint,
    40,
    32,
  );
  for (const side of [-1, 1]) {
    tube(
      hood,
      [
        [side * 0.49, -0.061, -0.08],
        [side * 0.475, -0.163, -0.91],
        [side * 0.58, -0.249, -1.43],
      ],
      0.018,
      black,
    );
    box(hood, [0.06, 0.017, 0.09], [side * 0.54, -0.018, -0.035], alloy, 0.005);
  }
  box(
    hood,
    [0.057, 0.04, 0.035],
    [0, -0.235, front - 0.55],
    steelMaterial(k),
    0.008,
  );
  for (const end of [front, rear])
    surface(
      group,
      (u, v) => [
        (v - 0.5) * THREE.MathUtils.lerp(1.6, 1.73, u),
        0.215 + u * (end === front ? 0.457 : 0.426),
        end + 0.011 * Math.sin(v * Math.PI),
      ],
      paint,
      12,
      40,
    );
  box(group, [1.24, 0.265, 0.035], [0, 0.38, front - 0.02], black, 0.065);
  for (let j = 0; j < 13; j++)
    box(
      group,
      [0.026, 0.207, 0.015],
      [-0.555 + j * 0.0925, 0.39, front - 0.044],
      black,
      0.004,
    );
  for (let j = 0; j < 4; j++)
    box(
      group,
      [1.08, 0.011, 0.022],
      [0, 0.299 + j * 0.052, front - 0.046],
      k.steel,
      0.003,
    );
  box(group, [0.33, 0.078, 0.025], [0, 0.42, rear + 0.02], black, 0.007);
  box(group, [0.22, 0.025, 0.018], [0, 0.694, front - 0.028], black, 0.007);
  const emblem = mesh(
    group,
    new THREE.TorusGeometry(0.027, 0.004, 8, 40),
    alloy,
    [0, 0.69, front - 0.049],
  );
  emblem.scale.x = 1.45;
  // Small roof antenna and a restrained trailing lip complete the silhouette.
  const antenna = mesh(
    group,
    new THREE.ConeGeometry(0.037, 0.068, 4),
    black,
    [0, 1.454, 2.055],
  );
  antenna.scale.z = 1.8;
  // Cabin furniture is visible through the glazing, with no bright distraction.
  for (const side of [-1, 1]) {
    box(group, [0.4, 0.13, 0.48], [side * 0.38, 0.41, 1.26], black, 0.05);
    const back = box(
      group,
      [0.405, 0.52, 0.14],
      [side * 0.38, 0.7, 1.48],
      black,
      0.052,
    );
    back.rotation.x = -0.12;
    box(group, [0.23, 0.17, 0.095], [side * 0.38, 1.022, 1.52], black, 0.045);
    box(group, [0.42, 0.14, 0.42], [side * 0.37, 0.43, 2.27], black, 0.04);
    box(group, [0.43, 0.43, 0.12], [side * 0.37, 0.69, 2.45], black, 0.045);
    box(group, [0.2, 0.14, 0.09], [side * 0.37, 0.955, 2.46], black, 0.04);
  }
  box(group, [1.36, 0.185, 0.285], [0, 0.79, 0.83], black, 0.04);
  box(group, [0.17, 0.023, 0.13], [0, 0.91, 0.845], black, 0.015);
  const steering = mesh(
    group,
    new THREE.TorusGeometry(0.16, 0.012, 10, 44),
    black,
    [-0.37, 0.843, 0.98],
  );
  steering.rotation.x = -0.5;
  bar(group, [-0.47, 0.84, 0.98], [-0.27, 0.84, 0.98], 0.009, alloy);
  batchVehicleModel(group);
  return {
    group,
    hood,
    materials: k.materials,
    setHood(amount: number) {
      hood.rotation.x = amount * 1.04;
    },
  };
}
function steelMaterial(k: ReturnType<typeof modelKit>) {
  return k.steel;
}
