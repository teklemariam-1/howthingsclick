import * as THREE from 'three';
import { modelKit, type P3 } from './vehicle-model';
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
  glass.color.set('#152327');
  glass.opacity = 0.88;
  glass.roughness = 0.23;
  glass.clearcoat = 0.35;
  const lamp = new THREE.MeshPhysicalMaterial({
    color: '#1c252a',
    metalness: 0.42,
    roughness: 0.13,
    clearcoat: 1,
    side: THREE.DoubleSide,
  });
  const amber = new THREE.MeshStandardMaterial({
    color: '#bc6b16',
    metalness: 0.35,
    roughness: 0.27,
    side: THREE.DoubleSide,
  });
  const tail = new THREE.MeshPhysicalMaterial({
    color: '#a50812',
    metalness: 0.15,
    roughness: 0.18,
    clearcoat: 1,
    side: THREE.DoubleSide,
  });
  k.materials.push(lamp, amber, tail);
  const front = -D.frontOverhang,
    rear = D.length - D.frontOverhang;
  const sideFront = front + 0.22,
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
    [sideFront, 0.765],
    [-0.39, 0.865],
    [0, 0.927],
    [0.63, 0.939],
    [1.65, 0.949],
    [2.7, 0.979],
    [3.2, 0.964],
    [sideRear, 0.881],
  ];
  const shoulder = (z: number) => profile(shoulders, z);
  const widths = [
    [sideFront, 0.841],
    [-0.35, 0.876],
    [0, 0.884],
    [0.63, 0.869],
    [1.7, 0.867],
    [2.7, 0.89],
    [3.25, 0.882],
    [sideRear, 0.839],
  ];
  const bodyWidth = (z: number) => profile(widths, z);
  function sidePoint(z: number, y: number, side: number): P3 {
    const t = THREE.MathUtils.clamp((y - 0.2) / (shoulder(z) - 0.2), 0, 1);
    const sculpt =
      -0.049 * (1 - t) ** 2 +
      0.012 * Math.sin(t * Math.PI) -
      0.004 * Math.exp(-(((t - 0.2) / 0.1) ** 2)) +
      0.002 * Math.exp(-(((t - 0.76) / 0.065) ** 2));
    return [side * (bodyWidth(z) + sculpt), y, z];
  }
  function archBottom(z: number) {
    let bottom = 0.207;
    for (const axle of [0, D.wheelbase]) {
      const distance = Math.abs(z - axle);
      if (distance < 0.357)
        bottom = Math.max(bottom, 0.3 + Math.sqrt(0.357 ** 2 - distance ** 2));
    }
    return bottom;
  }
  const hoodHinge: P3 = [0, 0.937, 0.625];
  function hoodPoint(u: number, v: number): P3 {
    const s = v * 2 - 1,
      half = lerp(0.724, 0.807, u);
    const z =
      lerp(front + 0.032, 0.624, u) + 0.244 * Math.abs(s) ** 2 * (1 - u) ** 4;
    const y =
      lerp(0.775, 0.938, u) -
      0.023 * s * s +
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
    tube(
      hood,
      [
        [side * 0.52, -0.065, -0.09],
        [side * 0.41, -0.125, -0.72],
        [side * 0.5, -0.225, -1.28],
      ],
      0.015,
      k.steel,
    );
    box(hood, [0.07, 0.017, 0.1], [side * 0.55, -0.025, -0.04], k.steel, 0.007);
  }
  box(hood, [0.055, 0.033, 0.025], [0, -0.224, front - 0.54], alloy, 0.007);
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
            r = 0.357 + 0.018 * v;
          const z = axle - Math.cos(a) * r,
            y = 0.3 + Math.sin(a) * r;
          return [side * (bodyWidth(z) + 0.004 - 0.005 * v), y, z];
        },
        paint,
        90,
        6,
      );
      surface(
        group,
        (u, v) => {
          const a = lerp(-0.25, Math.PI + 0.25, u),
            z = axle - Math.cos(a) * 0.351;
          return [
            side * (bodyWidth(z) - 0.012 - v * 0.13),
            0.3 + Math.sin(a) * 0.351,
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
          outer = sidePoint(h[2], shoulder(h[2]), side);
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
      const z = lerp(0.62, 2.93, i / 60);
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
        [0.59, 0.919],
        [0.61, 0.76],
        [0.59, 0.49],
        [0.55, 0.267],
        [0.66, 0.23],
        [1.64, 0.232],
      ],
      [
        [1.64, 0.945],
        [1.65, 0.76],
        [1.66, 0.46],
        [1.64, 0.232],
      ],
      [
        [2.79, 0.963],
        [2.66, 0.82],
        [2.4, 0.69],
        [2.32, 0.47],
        [2.26, 0.266],
        [1.68, 0.232],
      ],
    ];
    seams.forEach((points) =>
      tube(
        group,
        points.map(([z, y]) => {
          const p = sidePoint(z, y, side);
          p[0] += side * 0.0015;
          return p;
        }),
        0.0022,
        black,
      ),
    );
    for (const [z, y] of [
      [1.38, 0.859],
      [2.39, 0.885],
    ]) {
      const p = sidePoint(z, y, side);
      box(
        group,
        [0.009, 0.027, 0.148],
        [p[0] + side * 0.004, y - 0.004, z],
        black,
        0.012,
      );
      box(
        group,
        [0.018, 0.025, 0.139],
        [p[0] + side * 0.014, y + 0.004, z],
        paint,
        0.011,
      );
    }
  }
  // One flowing roof profile supplies the roof, glazing and broad painted pillars.
  const roofY = (z: number) =>
    profile(
      [
        [0.62, 0.949],
        [0.86, 1.176],
        [1.22, 1.407],
        [1.55, 1.433],
        [2.03, 1.424],
        [2.27, 1.352],
        [2.57, 1.175],
        [2.96, 0.986],
      ],
      z,
    );
  const roofW = (z: number) =>
    profile(
      [
        [0.62, 0.805],
        [1.22, 0.666],
        [1.6, 0.67],
        [2.03, 0.68],
        [2.27, 0.714],
        [2.96, 0.84],
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
          roofY(z) + 0.015 * (1 - s * s),
          z - 0.023 * (1 - s * s) * (z < 1.22 ? 1 : -1),
        ];
      },
      m,
      48,
      40,
    );
  }
  roofSurface(group, 0.638, 1.213, glass);
  roofSurface(group, 1.218, 2.055, paint);
  roofSurface(group, 2.064, 2.95, glass);
  for (const side of [-1, 1]) {
    const outer = new THREE.Shape();
    outer.moveTo(0.636, shoulder(0.636) + 0.012);
    for (let i = 0; i <= 100; i++) {
      const z = lerp(0.636, 2.96, i / 100);
      outer.lineTo(z, roofY(z));
    }
    for (let i = 100; i >= 0; i--) {
      const z = lerp(0.636, 2.96, i / 100);
      outer.lineTo(z, shoulder(z) + 0.012);
    }
    outer.closePath();
    const windows: THREE.Path[] = [];
    const frontWindow = new THREE.Path();
    frontWindow.moveTo(0.748, 0.982);
    frontWindow.lineTo(1.608, 0.992);
    frontWindow.lineTo(1.608, 1.388);
    frontWindow.quadraticCurveTo(1.405, 1.398, 1.246, 1.367);
    frontWindow.lineTo(0.748, 1.012);
    frontWindow.closePath();
    windows.push(frontWindow);
    const rearWindow = new THREE.Path();
    rearWindow.moveTo(1.68, 0.994);
    rearWindow.lineTo(2.427, 1.015);
    rearWindow.lineTo(2.356, 1.269);
    rearWindow.quadraticCurveTo(2.233, 1.348, 2.091, 1.372);
    rearWindow.lineTo(1.68, 1.388);
    rearWindow.closePath();
    windows.push(rearWindow);
    const quarter = new THREE.Path();
    quarter.moveTo(2.465, 1.016);
    quarter.lineTo(2.813, 1.012);
    quarter.lineTo(2.572, 1.177);
    quarter.lineTo(2.4, 1.269);
    quarter.closePath();
    windows.push(quarter);
    outer.holes.push(...windows);
    const cabinPoint = (z: number, y: number, offset = 0): P3 => {
      const low = shoulder(z) + 0.012,
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
      const g = new THREE.ShapeGeometry(shape, 72),
        p = g.getAttribute('position');
      for (let i = 0; i < p.count; i++) {
        const q = cabinPoint(p.getX(i), p.getY(i), offset);
        p.setXYZ(i, ...q);
      }
      g.computeVertexNormals();
      return mesh(group, g, material);
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
    // The B pillar is a black applique between the two door windows.
    surface(
      group,
      (u, v) => {
        const z = lerp(1.609, 1.679, u),
          y = lerp(0.99, 1.392, v);
        return cabinPoint(z, y, 0.003);
      },
      black,
      6,
      20,
    );
    // Body-colored, oval mirror on the black triangular mounting sail.
    box(group, [0.031, 0.106, 0.12], [side * 0.824, 0.982, 0.741], black, 0.02);
    const mirror = mesh(group, new THREE.SphereGeometry(1, 32, 20), paint, [
      side * 0.944,
      1.008,
      0.751,
    ]);
    mirror.scale.set(0.105, 0.056, 0.086);
    const underside = mesh(group, new THREE.SphereGeometry(1, 24, 16), black, [
      side * 0.944,
      0.989,
      0.761,
    ]);
    underside.scale.set(0.106, 0.041, 0.086);
    const reflector = mesh(group, new THREE.SphereGeometry(1, 24, 16), glass, [
      side * 0.948,
      1.011,
      0.817,
    ]);
    reflector.scale.set(0.085, 0.041, 0.012);
  }
  // A continuous rear deck blends into both quarters and the rear fascia.
  const trunkPoint = (u: number, v: number): P3 => {
    const side = v * 2 - 1;
    const z = lerp(2.96, rear, u) - 0.17 * Math.abs(side) ** 3 * u ** 4;
    const halfWidth = lerp(0.84, 0.84, u);
    return [
      side * halfWidth,
      lerp(0.986, 0.881, u) + 0.02 * (1 - side * side),
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
  function nose(x: number, y: number, delta = 0): P3 {
    return [
      x,
      y,
      front +
        0.22 * (Math.abs(x) / 0.85) ** 3 +
        0.065 * ((y - 0.51) / 0.32) ** 2 +
        delta,
    ];
  }
  surface(
    group,
    (u, v) => {
      const x = (v * 2 - 1) * (0.825 + 0.024 * Math.sin(Math.PI * u));
      const lampInset =
        Math.abs(x) > 0.35
          ? 0.066 * Math.sin(Math.min(1, (Math.abs(x) - 0.35) / 0.5) * Math.PI)
          : 0;
      const y = lerp(0.205, 0.752 - lampInset, u);
      return nose(x, y);
    },
    paint,
    38,
    84,
  );
  // Rounded corner returns close the fascia-to-fender joints at every height.
  for (const side of [-1, 1]) {
    surface(
      group,
      (u, v) => {
        const y = lerp(0.205, 0.746, u);
        const face = nose(side * (0.825 + 0.024 * Math.sin(Math.PI * u)), y);
        const wing = sidePoint(sideFront, y, side);
        return [lerp(face[0], wing[0], v), y, lerp(face[2], wing[2], v)];
      },
      paint,
      42,
      12,
    );
    surface(
      group,
      (u, v) => {
        const y = lerp(0.205, 0.881, u),
          x = 0.816 + 0.024 * Math.sin(u * Math.PI);
        const face: P3 = [
          side * x,
          y,
          rear - 0.17 * (x / 0.84) ** 3 - 0.035 * (1 - u) ** 3,
        ];
        const quarter = sidePoint(sideRear, y, side);
        return [lerp(face[0], quarter[0], v), y, lerp(face[2], quarter[2], v)];
      },
      paint,
      42,
      12,
    );
  }
  // LE lower intake: wide at the foot, narrowing below the Toyota emblem.
  const grilleWidth = (v: number) =>
    profile(
      [
        [0, 0.59],
        [0.22, 0.638],
        [0.67, 0.545],
        [1, 0.447],
      ],
      v,
    );
  surface(
    group,
    (u, v) => nose((u * 2 - 1) * grilleWidth(v), lerp(0.239, 0.627, v), -0.012),
    black,
    48,
    24,
  );
  for (let j = 0; j < 8; j++) {
    const v = (j + 0.4) / 8,
      y = lerp(0.252, 0.615, v),
      w = grilleWidth(v) - 0.014;
    const p: P3[] = [];
    for (let i = 0; i <= 24; i++) p.push(nose(lerp(-w, w, i / 24), y, -0.018));
    tube(group, p, 0.005, k.steel);
  }
  for (const side of [-1, 1]) {
    const upper = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.365, 0.765, front + 0.035),
      new THREE.Vector3(0.653, 0.795, front + 0.125),
      new THREE.Vector3(0.857, 0.864, front + 0.49),
    ]);
    const lower = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.365, 0.739, front + 0.034),
      new THREE.Vector3(0.666, 0.684, front + 0.123),
      new THREE.Vector3(0.85, 0.767, front + 0.442),
    ]);
    const lampPoint = (p: THREE.Vector3, t: number, offset: number): P3 => [
      side * (p.x + 0.019 * t ** 3),
      p.y,
      p.z - 0.03 * (1 - t) - offset,
    ];
    const lens = surface(
      group,
      (u, v) => {
        const p = upper.getPoint(u).lerp(lower.getPoint(u), v);
        return lampPoint(p, u, 0.003);
      },
      lamp,
      42,
      20,
    );
    lens.castShadow = false;
    const border: P3[] = [];
    for (let i = 0; i <= 40; i++) {
      const p = upper.getPoint(i / 40);
      border.push(lampPoint(p, i / 40, 0.006));
    }
    for (let i = 40; i >= 0; i--) {
      const p = lower.getPoint(i / 40);
      border.push(lampPoint(p, i / 40, 0.006));
    }
    tube(group, border, 0.004, black);
    for (const t of [0.28, 0.52, 0.67]) {
      const p = upper.getPoint(t).lerp(lower.getPoint(t), 0.51);
      const bowl = mesh(
        group,
        new THREE.SphereGeometry(1, 24, 16),
        alloy,
        lampPoint(p, t, 0.012),
      );
      bowl.scale.set(0.044, 0.026, 0.018);
      const bulb = mesh(
        group,
        new THREE.SphereGeometry(1, 18, 12),
        lamp,
        lampPoint(p, t, 0.027),
      );
      bulb.scale.set(0.024, 0.018, 0.008);
    }
    const strip: P3[] = [];
    for (let i = 0; i <= 32; i++) {
      const p = upper.getPoint(i / 40).lerp(lower.getPoint(i / 40), 0.2);
      strip.push(lampPoint(p, i / 40, 0.018));
    }
    tube(group, strip, 0.0038, alloy);
    surface(
      group,
      (u, v) => {
        const t = lerp(0.78, 0.98, u),
          p = upper.getPoint(t).lerp(lower.getPoint(t), lerp(0.28, 0.89, v));
        return lampPoint(p, t, 0.012);
      },
      amber,
      12,
      5,
    );
    // Tail lamps wrap around the rear quarter, without emissive neon outlines.
    surface(
      group,
      (u, v) => {
        const x = lerp(0.42, 0.838, u),
          z = rear + 0.008 - 0.17 * (x / 0.84) ** 3;
        return [side * x, lerp(0.805 - u * 0.012, 0.892 - u * 0.015, v), z];
      },
      tail,
      32,
      10,
    );
    surface(
      group,
      (u, v) => {
        const z = lerp(sideRear - 0.24, sideRear, u);
        const y = lerp(0.848 - 0.047 * u, 0.946 - 0.069 * u, v);
        const p = sidePoint(z, y, side);
        return [p[0] + side * 0.003, p[1], p[2]];
      },
      tail,
      24,
      10,
    );
    const tailline: P3[] = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      tailline.push([
        side * lerp(0.46, 0.843, u),
        0.855 - 0.012 * u,
        rear + 0.014 - 0.17 * (lerp(0.46, 0.833, u) / 0.84) ** 3,
      ]);
    }
    tube(group, tailline, 0.006, k.red);
  }
  // Upper grille, badge, rear fascia and recessed registration panel.
  const upperGrille: P3[] = [];
  for (let i = 0; i <= 40; i++)
    upperGrille.push(nose(lerp(-0.41, 0.41, i / 40), 0.744, -0.008));
  tube(group, upperGrille, 0.009, black);
  function emblem(z: number, y: number) {
    const outer = mesh(
      group,
      new THREE.TorusGeometry(0.027, 0.0035, 8, 48),
      alloy,
      [0, y, z],
    );
    outer.scale.x = 1.47;
    const vertical = mesh(
      group,
      new THREE.TorusGeometry(0.021, 0.0028, 8, 40),
      alloy,
      [0, y, z - 0.002],
    );
    vertical.scale.x = 0.55;
    const cross = mesh(
      group,
      new THREE.TorusGeometry(0.021, 0.0025, 8, 40),
      alloy,
      [0, y + 0.008, z - 0.003],
    );
    cross.scale.set(1.42, 0.47, 1);
  }
  emblem(front + 0.005, 0.737);
  surface(
    group,
    (u, v) => {
      const y = lerp(0.205, 0.881, u),
        x = (v * 2 - 1) * (0.816 + 0.024 * Math.sin(u * Math.PI));
      return [
        x,
        y,
        rear - 0.17 * (Math.abs(x) / 0.84) ** 3 - 0.035 * (1 - u) ** 3,
      ];
    },
    paint,
    36,
    70,
  );
  box(group, [0.38, 0.135, 0.015], [0, 0.667, rear + 0.003], black, 0.022);
  box(group, [0.303, 0.102, 0.014], [0, 0.667, rear + 0.013], k.steel, 0.006);
  emblem(rear + 0.01, 0.852);
  for (const side of [-1, 1])
    box(
      group,
      [0.14, 0.027, 0.017],
      [side * 0.681, 0.32, rear - 0.073],
      tail,
      0.01,
    );
  const trunkSeam: P3[] = [];
  for (let i = 0; i <= 50; i++) {
    const x = lerp(-0.73, 0.73, i / 50);
    trunkSeam.push([x, 0.89, rear - 0.019 - 0.037 * (Math.abs(x) / 0.73) ** 3]);
  }
  tube(group, trunkSeam, 0.0025, black);
  const antenna = mesh(
    group,
    new THREE.SphereGeometry(1, 24, 16),
    paint,
    [0, 1.465, 1.975],
  );
  antenna.scale.set(0.027, 0.035, 0.063);
  return {
    hood,
    setHood(amount: number) {
      hood.rotation.x = amount * 1.04;
    },
  };
}
