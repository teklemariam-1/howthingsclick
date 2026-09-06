import * as THREE from 'three';
import { modelKit, type P3 } from './vehicle-model';
import { createCorollaFascia } from './corolla-fascia';
import { createCorollaRear } from './corolla-rear';
import { bodyPatch } from './body-surface';
import { VEHICLE_DIMENSIONS as D } from '../../lib/engine/vehicle-dimensions';

// Original lofted geometry, shaped from the supplied Corolla LE reference photos.
// X crosses the car; Z runs from the front bumper to the rear bumper, in metres.
export function createCorollaShell(
  k: ReturnType<typeof modelKit>,
  group: THREE.Group,
) {
  const { surface, tube, mesh, box, paint, black, alloy, glass, rubber } = k;
  paint.color.set('#e5e8e6');
  paint.metalness = 0.12;
  paint.roughness = 0.31;
  paint.clearcoatRoughness = 0.24;
  paint.side = THREE.DoubleSide;
  black.side = THREE.DoubleSide;
  glass.color.set('#1d2925');
  glass.opacity = 0.9;
  glass.roughness = 0.23;
  glass.clearcoat = 0.15;
  glass.envMapIntensity = 0.22;
  glass.metalness = 0.02;
  glass.specularIntensity = 0.18;
  glass.reflectivity = 0.15;
  const front = -D.frontOverhang,
    rear = D.length - D.frontOverhang;
  const sideFront = front + 0.56,
    sideRear = rear - 0.17;
  const lerp = THREE.MathUtils.lerp;
  function profile(points: number[][], z: number) {
    let i = 0;
    while (i < points.length - 2 && z > points[i + 1][0]) i++;
    const [a, b] = [points[i], points[i + 1]];
    const t = THREE.MathUtils.clamp((z - a[0]) / (b[0] - a[0]), 0, 1);
    const slope = (j: number) => {
      const p = points[Math.max(0, j - 1)],
        n = points[Math.min(points.length - 1, j + 1)];
      return (n[1] - p[1]) / (n[0] - p[0]);
    };
    return (
      (2 * t ** 3 - 3 * t * t + 1) * a[1] +
      (t ** 3 - 2 * t * t + t) * (b[0] - a[0]) * slope(i) +
      (-2 * t ** 3 + 3 * t * t) * b[1] +
      (t ** 3 - t * t) * (b[0] - a[0]) * slope(i + 1)
    );
  }
  const shoulders = [
    [sideFront, 0.817],
    [0, 0.907],
    [0.32, 0.958],
    [1.55, 0.976],
    [2.55, 1.018],
    [2.9, 1.025],
    [3.35, 1.0],
    [sideRear, 0.931],
  ];
  const shoulder = (z: number) => profile(shoulders, z);
  const widths = [
    [sideFront, 0.877],
    [-0.35, 0.876],
    [0, 0.884],
    [0.63, 0.869],
    [1.7, 0.867],
    [2.7, 0.89],
    [3.25, 0.882],
    [sideRear, 0.828],
  ];
  const bodyWidth = (z: number) => profile(widths, z);
  function sidePoint(z: number, y: number, side: number): P3 {
    const t = THREE.MathUtils.clamp((y - 0.2) / (shoulder(z) - 0.2), 0, 1);
    const sculpt =
      -0.063 * (1 - t) ** 2 +
      0.026 * Math.sin(t * Math.PI) -
      0.022 * Math.exp(-(((t - 0.27) / 0.095) ** 2)) +
      0.004 * Math.exp(-(((t - 0.76) / 0.1) ** 2));
    const toe = 0.105 * (1 - THREE.MathUtils.smoothstep(y, 0.22, 0.54));
    const frontReturn =
      1 - THREE.MathUtils.smoothstep(z, sideFront, sideFront + 0.23);
    const rearBlend = THREE.MathUtils.smoothstep(z, 3.13, sideRear);
    const rearRound = profile(
      [
        [0.25, -0.09],
        [0.43, 0.01],
        [0.61, 0.042],
        [0.8, 0.025],
        [0.95, 0],
      ],
      y,
    );
    return [
      side * (bodyWidth(z) + sculpt),
      y,
      z + toe * frontReturn + rearBlend * rearRound,
    ];
  }
  function archBottom(z: number) {
    let bottom = profile(
      [
        [sideFront, 0.224],
        [0.38, 0.19],
        [2.3, 0.195],
        [3.12, 0.215],
        [sideRear, 0.3],
      ],
      z,
    );
    for (const axle of [0, D.wheelbase]) {
      const distance = Math.abs(z - axle);
      if (distance < 0.35)
        bottom = Math.max(bottom, 0.316 + Math.sqrt(0.35 ** 2 - distance ** 2));
    }
    return bottom;
  }
  const fascia = createCorollaFascia(k, group, front, sidePoint);
  const hoodHinge: P3 = [0, 0.96, 0.32];
  function hoodPoint(u: number, v: number): P3 {
    const s = v * 2 - 1,
      half = lerp(0.66, 0.793, u);
    const nose =
      front +
      0.56 * (1 - Math.sqrt(1 - ((0.66 * s) / 0.866) ** 2)) ** 1.8 +
      0.009;
    const z = lerp(nose, 0.319, u);
    const y =
      lerp(0.738, 0.962, u) -
      0.009 * s * s +
      0.031 * s * s * (1 - u) ** 1.5 +
      0.018 * Math.sin(Math.PI * u) +
      0.006 *
        Math.exp(-(((Math.abs(s) - 0.62) / 0.08) ** 2)) *
        Math.sin(Math.PI * u);
    return [s * half, y, z];
  }
  const hood = new THREE.Group();
  hood.name = 'opening-hood';
  hood.position.set(...hoodHinge);
  group.add(hood);
  surface(
    hood,
    (u, v) => {
      const p = hoodPoint(u, v);
      return [p[0], p[1] - hoodHinge[1], p[2] - hoodHinge[2]];
    },
    paint,
    72,
    48,
  );
  // An inset underside gives the hood thickness and conceals its reinforcing ribs.
  surface(
    hood,
    (u, v) => {
      const p = hoodPoint(0.035 + u * 0.93, 0.02 + v * 0.96);
      return [p[0], p[1] - hoodHinge[1] - 0.018, p[2] - hoodHinge[2]];
    },
    rubber,
    36,
    24,
  );
  for (const side of [-1, 1]) {
    const lip: P3[] = [];
    for (let i = 0; i <= 64; i++) {
      const p = hoodPoint(i / 64, (side + 1) / 2);
      lip.push([p[0], p[1] - hoodHinge[1] - 0.007, p[2] - hoodHinge[2]]);
    }
    tube(hood, lip, 0.007, paint);
    const brace = [0.12, 0.5, 0.9].map((u) => {
      const p = hoodPoint(u, side < 0 ? 0.21 : 0.79);
      return [p[0], p[1] - hoodHinge[1] - 0.035, p[2] - hoodHinge[2]] as P3;
    });
    tube(hood, brace, 0.013, k.steel);
    box(hood, [0.07, 0.017, 0.1], [side * 0.55, -0.025, -0.04], k.steel, 0.007);
  }
  const latch = hoodPoint(0.035, 0.5);
  box(
    hood,
    [0.055, 0.033, 0.025],
    [0, latch[1] - hoodHinge[1] - 0.03, latch[2] - hoodHinge[2]],
    alloy,
    0.007,
  );
  for (const side of [-1, 1]) {
    const skin = surface(
      group,
      (u, v) => {
        const z = lerp(sideFront, sideRear, u),
          y = lerp(archBottom(z), shoulder(z), v);
        return sidePoint(z, y, side);
      },
      paint,
      280,
      36,
    );
    // The positive-X panel must face outward as well as have outward normals.
    // Double-sided shading flips normals on back faces; a winding mismatch makes
    // white paint look like a dark chrome stripe under the studio lights.
    if (side > 0) {
      const index = skin.geometry.getIndex()!;
      for (let i = 0; i < index.count; i += 3) {
        const b = index.getX(i + 1);
        index.setX(i + 1, index.getX(i + 2));
        index.setX(i + 2, b);
      }
    }
    // Stable body normals keep the wheel cut-outs from distorting door reflections.
    const p = skin.geometry.getAttribute('position'),
      normals = skin.geometry.getAttribute('normal');
    for (let i = 0; i < p.count; i++) {
      const z = p.getZ(i),
        y = p.getY(i),
        e = 0.0002;
      const dz = new THREE.Vector3(...sidePoint(z + e, y, side)).sub(
        new THREE.Vector3(...sidePoint(z - e, y, side)),
      );
      const dy = new THREE.Vector3(...sidePoint(z, y + e, side)).sub(
        new THREE.Vector3(...sidePoint(z, y - e, side)),
      );
      const n = dy.cross(dz).normalize().multiplyScalar(side);
      normals.setXYZ(i, n.x, n.y, n.z);
    }
    for (const axle of [0, D.wheelbase]) {
      // Flush painted arch flange and a recessed black wheel-house liner.
      surface(
        group,
        (u, v) => {
          const a = lerp(-0.13, Math.PI + 0.13, u),
            r = 0.35 + 0.014 * v;
          const z = axle - Math.cos(a) * r,
            y = 0.316 + Math.sin(a) * r;
          const p = sidePoint(z, y, side);
          return [p[0] + side * 0.001, y, p[2]];
        },
        paint,
        90,
        6,
      );
      surface(
        group,
        (u, v) => {
          const a = lerp(-0.25, Math.PI + 0.25, u),
            z = axle - Math.cos(a) * 0.346;
          return [
            side * (bodyWidth(z) - 0.012 - v * 0.13),
            0.316 + Math.sin(a) * 0.346,
            z,
          ];
        },
        rubber,
        72,
        6,
      );
    }
    // Fender shoulders meet the curved hood opening exactly.
    surface(
      group,
      (u, v) => {
        const h = hoodPoint(u, (side + 1) / 2),
          outer =
            h[2] < sideFront
              ? fascia.face(
                  side * fascia.angleAtZ(h[2]),
                  fascia.height(fascia.angleAtZ(h[2])),
                )
              : sidePoint(h[2], shoulder(h[2]), side);
        return [
          lerp(h[0] + side * 0.006, outer[0], v),
          lerp(h[1] - 0.001, outer[1], v) + 0.016 * Math.sin(v * Math.PI),
          h[2],
        ];
      },
      paint,
      72,
      20,
    );
    // Beltline, stamped door character line and gently rising rocker.
    const belt: P3[] = [],
      rocker: P3[] = [];
    for (let i = 0; i <= 60; i++) {
      const z = lerp(0.35, 2.83, i / 60);
      belt.push([side * (bodyWidth(z) + 0.001), shoulder(z) + 0.006, z]);
      if (z < 2.32)
        rocker.push(
          sidePoint(z, 0.248 + 0.009 * Math.sin((i / 60) * Math.PI), side),
        );
    }
    tube(group, belt, 0.007, black);
    tube(group, rocker, 0.006, paint);
    const seams = [
      [
        [0.5, 0.958],
        [0.48, 0.82],
        [0.49, 0.54],
        [0.56, 0.274],
        [0.68, 0.23],
        [1.56, 0.225],
      ],
      [
        [1.6, 0.976],
        [1.59, 0.82],
        [1.575, 0.56],
        [1.57, 0.225],
      ],
      [
        [2.67, 1.02],
        [2.7, 0.94],
        [2.49, 0.6],
        [2.28, 0.252],
        [1.58, 0.225],
      ],
    ];
    seams.forEach((points) => {
      const curve = new THREE.CatmullRomCurve3(
        points.map(([z, y]) => new THREE.Vector3(z, y, 0)),
      );
      tube(
        group,
        curve.getPoints(100).map((v) => {
          const p = sidePoint(v.x, v.y, side);
          p[0] += side * 0.003;
          return p;
        }),
        0.0016,
        k.steel,
      );
    });
    for (const [z, y] of [
      [1.39, 0.86],
      [2.31, 0.9],
    ]) {
      const p = sidePoint(z, y, side);
      const pocket = mesh(group, new THREE.SphereGeometry(1, 32, 16), k.steel, [
        p[0] - side * 0.001,
        y - 0.008,
        z,
      ]);
      pocket.scale.set(0.004, 0.019, 0.087);
      box(
        group,
        [0.023, 0.022, 0.159],
        [p[0] + side * 0.015, y + 0.004, z],
        paint,
        0.008,
      );
      box(
        group,
        [0.027, 0.018, 0.018],
        [p[0] + side * 0.014, y + 0.003, z + 0.064],
        paint,
        0.006,
      );
    }
  }
  // The filler door is on the left rear quarter of the reference LE.
  const filler = new THREE.Shape();
  filler.moveTo(2.756, 0.996);
  filler.lineTo(2.916, 0.996);
  filler.quadraticCurveTo(2.94, 0.996, 2.94, 0.972);
  filler.lineTo(2.94, 0.844);
  filler.quadraticCurveTo(2.94, 0.822, 2.916, 0.822);
  filler.lineTo(2.756, 0.822);
  filler.quadraticCurveTo(2.732, 0.822, 2.732, 0.846);
  filler.lineTo(2.732, 0.972);
  filler.quadraticCurveTo(2.732, 0.996, 2.756, 0.996);
  tube(
    group,
    filler.getPoints(12).map((p) => {
      const q = sidePoint(p.x, p.y, -1);
      q[0] -= 0.002;
      return q;
    }),
    0.0016,
    k.steel,
  );
  // One flowing roof profile supplies the roof, glazing and broad painted pillars.
  const roofY = (z: number) =>
    profile(
      [
        [0.32, 0.96],
        [0.62, 1.118],
        [1.07, 1.328],
        [1.36, 1.385],
        [1.82, 1.39],
        [2.19, 1.342],
        [2.43, 1.25],
        [2.76, 1.075],
        [3.11, 1.011],
      ],
      z,
    );
  const roofW = (z: number) =>
    profile(
      [
        [0.32, 0.795],
        [1.07, 0.683],
        [1.5, 0.689],
        [2.19, 0.696],
        [2.43, 0.74],
        [3.11, 0.841],
      ],
      z,
    );
  function roofSurface(
    parent: THREE.Group,
    z0: number,
    z1: number,
    m: THREE.Material,
  ) {
    surface(
      parent,
      (u, v) => {
        const z = lerp(z0, z1, u),
          s = v * 2 - 1;
        return [
          s * roofW(z),
          roofY(z) + 0.032 * (1 - s * s),
          z - 0.023 * (1 - s * s) * (z < 1.1 ? 1 : -1),
        ];
      },
      m,
      48,
      40,
    );
  }
  roofSurface(group, 0.329, 1.093, glass);
  roofSurface(group, 1.099, 2.398, paint);
  roofSurface(group, 2.405, 3.1, glass);
  for (const side of [-1, 1]) {
    const outer = new THREE.Shape();
    outer.moveTo(0.325, shoulder(0.325) - 0.004);
    for (let i = 0; i <= 100; i++) {
      const z = lerp(0.325, 3.11, i / 100);
      outer.lineTo(z, roofY(z));
    }
    for (let i = 100; i >= 0; i--) {
      const z = lerp(0.325, 3.11, i / 100);
      outer.lineTo(z, shoulder(z) - 0.004);
    }
    outer.closePath();
    const windows: THREE.Path[] = [];
    function windowPath(points: number[][]) {
      const p = new THREE.Path();
      p.moveTo(...(points[0] as [number, number]));
      points.slice(1).forEach(([z, y]) => p.lineTo(z, y));
      p.closePath();
      windows.push(p);
    }
    windowPath([
      [0.4, 0.966],
      [0.533, 1.049],
      [0.51, 0.969],
    ]);
    const frontWindow = new THREE.Path();
    frontWindow.moveTo(0.551, 0.969);
    frontWindow.lineTo(0.574, 1.07);
    frontWindow.quadraticCurveTo(0.826, 1.221, 1.069, 1.312);
    frontWindow.quadraticCurveTo(1.28, 1.355, 1.586, 1.352);
    frontWindow.lineTo(1.518, 0.985);
    frontWindow.closePath();
    windows.push(frontWindow);
    const rearWindow = new THREE.Path();
    rearWindow.moveTo(1.68, 0.992);
    rearWindow.lineTo(1.73, 1.353);
    rearWindow.quadraticCurveTo(2.02, 1.341, 2.36, 1.266);
    rearWindow.lineTo(2.335, 1.026);
    rearWindow.closePath();
    windows.push(rearWindow);
    windowPath([
      [2.383, 1.028],
      [2.401, 1.242],
      [2.548, 1.165],
      [2.744, 1.069],
      [2.67, 1.044],
    ]);
    outer.holes.push(...windows);
    const cabinPoint = (z: number, y: number, offset = 0): P3 => {
      const low = shoulder(z) - 0.004,
        high = roofY(z);
      const t = THREE.MathUtils.clamp(
        (y - low) / Math.max(0.001, high - low),
        0,
        1,
      );
      return [side * (lerp(bodyWidth(z) - 0.006, roofW(z), t) + offset), y, z];
    };
    function cabinGeometry(
      shape: THREE.Shape,
      material: THREE.Material,
      offset = 0,
    ) {
      return bodyPatch(
        k,
        group,
        shape,
        material,
        (z, y) => cabinPoint(z, y, offset),
        2,
      );
    }
    cabinGeometry(outer, paint);
    for (const outline of windows) {
      cabinGeometry(new THREE.Shape(outline.getPoints(64)), glass, 0.001);
      tube(
        group,
        outline.getPoints(64).map((p) => cabinPoint(p.x, p.y, 0.002)),
        0.007,
        black,
      );
    }
    // Black B-pillar applique is slightly swept, matching the door frame.
    const bp = new THREE.Shape();
    bp.moveTo(1.518, 0.985);
    bp.lineTo(1.586, 1.358);
    bp.lineTo(1.73, 1.355);
    bp.lineTo(1.68, 0.992);
    bp.closePath();
    cabinGeometry(bp, black, 0.003);
    // Flat-backed, body-coloured mirror cap with a black pedestal.
    const stem = box(
      group,
      [0.044, 0.112, 0.061],
      [side * 0.839, 0.987, 0.625],
      black,
      0.014,
    );
    stem.rotation.z = -side * 0.21;
    surface(
      group,
      (u, v) => {
        const a = u * Math.PI * 2,
          t = v * 0.82,
          r = Math.sqrt(Math.max(0, 1 - (t * 2 - 1) ** 2));
        return [
          side * 0.925 + Math.cos(a) * 0.087 * r,
          1.046 + Math.sin(a) * 0.044 * r,
          0.515 + t * 0.178,
        ];
      },
      paint,
      48,
      22,
    );
    const base = box(
      group,
      [0.149, 0.029, 0.144],
      [side * 0.922, 1.012, 0.607],
      black,
      0.014,
    );
    base.rotation.y = side * 0.16;
    const mirror = box(
      group,
      [0.122, 0.056, 0.006],
      [side * 0.922, 1.045, 0.673],
      glass,
      0.02,
    );
    mirror.rotation.y = side * 0.16;
  }
  // A continuous rear deck blends into both quarters and the rear fascia.
  const trunkPoint = (u: number, v: number): P3 => {
    const side = v * 2 - 1;
    const z = lerp(3.11, rear, u) - 0.17 * Math.abs(side) ** 3 * u ** 4;
    const halfWidth = lerp(0.84, 0.84, u);
    return [
      side * halfWidth,
      lerp(1.011, 0.943, u) + 0.02 * (1 - side * side),
      z,
    ];
  };
  surface(group, trunkPoint, paint, 72, 60);
  for (const side of [-1, 1]) {
    surface(
      group,
      (u, v) => {
        const inner = trunkPoint(u, (side + 1) / 2);
        const outer = sidePoint(inner[2], shoulder(inner[2]), side);
        return [
          lerp(inner[0], outer[0], v),
          lerp(inner[1], outer[1], v),
          inner[2],
        ];
      },
      paint,
      72,
      16,
    );
  }
  createCorollaRear(k, group, rear, sideRear, sidePoint);
  // A low shark-fin aerial follows the roof instead of floating above it.
  const aerialOutline = new THREE.Shape();
  aerialOutline.moveTo(-0.09, 0);
  aerialOutline.quadraticCurveTo(-0.025, 0.018, 0.035, 0.058);
  aerialOutline.quadraticCurveTo(0.062, 0.074, 0.068, 0.027);
  aerialOutline.lineTo(0.085, 0);
  aerialOutline.closePath();
  const aerialGeometry = new THREE.ExtrudeGeometry(aerialOutline, {
    depth: 0.018,
    steps: 1,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.003,
    bevelThickness: 0.003,
    curveSegments: 14,
  });
  aerialGeometry.rotateY(-Math.PI / 2);
  aerialGeometry.translate(0.009, 0, 0);
  mesh(group, aerialGeometry, paint, [0, roofY(2.13) + 0.024, 2.13]);
  return {
    hood,
    setHood: (amount: number) => {
      hood.rotation.x = amount * 1.04;
    },
  };
}
