import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import badgeFont from './corolla-badge-font.json';
import type { ModelKit, P3 } from './vehicle-model';
import { bodyOutline, bodyPatch } from './body-surface';

export function createCorollaRear(
  k: ModelKit,
  group: THREE.Group,
  rear: number,
  sideRear: number,
  sidePoint: (z: number, y: number, side: number) => P3,
) {
  const { paint, black, alloy, mesh, tube, surface, box } = k;
  const material = (color: string, metalness: number, roughness: number) => {
    const m = new THREE.MeshPhysicalMaterial({
      color,
      metalness,
      roughness,
      clearcoat: 0.8,
      side: THREE.DoubleSide,
    });
    k.materials.push(m);
    return m;
  };
  const red = material('#aa0912', 0.18, 0.22),
    clear = material('#9ba8a6', 0.65, 0.23),
    lensBlack = material('#151b1e', 0.2, 0.26),
    valanceMat = material('#192024', 0.05, 0.67);
  const width = (y: number) =>
    0.774 +
    0.054 *
      Math.sin(
        (THREE.MathUtils.clamp((y - 0.288) / (0.941 - 0.288), 0, 1) * Math.PI) /
          2,
      );
  const face = (x: number, y: number, offset = 0): P3 => {
    const t = THREE.MathUtils.clamp((y - 0.288) / 0.653, 0, 1);
    const plate =
      (1 - THREE.MathUtils.smoothstep(Math.abs(x), 0.22, 0.41)) *
      THREE.MathUtils.smoothstep(y, 0.578, 0.627) *
      (1 - THREE.MathUtils.smoothstep(y, 0.788, 0.832));
    const shoulder = 0.018 * Math.exp(-(((y - 0.567) / 0.048) ** 2));
    return [
      x,
      y,
      rear -
        0.17 * (Math.abs(x) / 0.84) ** 3 -
        0.09 * (1 - t) ** 3 -
        0.027 * plate +
        shoulder +
        offset,
    ];
  };
  const mapped = (s: THREE.Shape, m: THREE.Material, o = 0) =>
    bodyPatch(k, group, s, m, (x, y) => face(x, y, o));
  const outer = new THREE.Shape();
  outer.moveTo(-width(0.288), 0.288);
  outer.lineTo(width(0.288), 0.288);
  for (let i = 1; i <= 48; i++) {
    const y = 0.288 + (0.653 * i) / 48;
    outer.lineTo(width(y), y);
  }
  outer.lineTo(-width(0.941), 0.941);
  for (let i = 47; i >= 0; i--) {
    const y = 0.288 + (0.653 * i) / 48;
    outer.lineTo(-width(y), y);
  }
  outer.closePath();
  const valance = new THREE.Shape();
  valance.moveTo(-0.565, 0.51);
  valance.quadraticCurveTo(0, 0.524, 0.565, 0.51);
  valance.bezierCurveTo(0.682, 0.504, 0.71, 0.368, 0.758, 0.3);
  valance.quadraticCurveTo(0, 0.286, -0.758, 0.3);
  valance.bezierCurveTo(-0.71, 0.368, -0.682, 0.504, -0.565, 0.51);
  valance.closePath();
  const lamp = (side: number) => {
    const s = new THREE.Shape();
    s.moveTo(side * 0.35, 0.872);
    s.bezierCurveTo(
      side * 0.45,
      0.888,
      side * 0.46,
      0.936,
      side * 0.585,
      0.938,
    );
    s.lineTo(side * 0.823, 0.934);
    s.lineTo(side * 0.833, 0.831);
    s.quadraticCurveTo(side * 0.697, 0.803, side * 0.602, 0.811);
    s.bezierCurveTo(
      side * 0.55,
      0.814,
      side * 0.506,
      0.861,
      side * 0.35,
      0.859,
    );
    s.closePath();
    return s;
  };
  const lamps = [-1, 1].map(lamp);
  const lowerLamps = [-1, 1].map((side) => {
    const s = new THREE.Shape();
    s.moveTo(side * 0.405, 0.858);
    s.quadraticCurveTo(side * 0.56, 0.868, side * 0.824, 0.865);
    s.lineTo(side * 0.831, 0.834);
    s.quadraticCurveTo(side * 0.695, 0.809, side * 0.603, 0.816);
    s.bezierCurveTo(
      side * 0.559,
      0.817,
      side * 0.535,
      0.855,
      side * 0.405,
      0.858,
    );
    s.closePath();
    return s;
  });
  const reflectors = [-1, 1].map((side) =>
    bodyOutline(
      [
        [0.746, 0.356],
        [0.738, 0.513],
        [0.777, 0.527],
        [0.787, 0.37],
      ].map(([x, y]) => [side * x, y]),
    ),
  );
  outer.holes.push(valance, ...lamps, ...reflectors);
  mapped(outer, paint);
  // Close the curved deck edge all the way across the upper rear panel.
  surface(
    group,
    (u, v) => {
      const x = (u * 2 - 1) * 0.839,
        upper = 0.943 + 0.02 * (1 - (x / 0.84) ** 2);
      return [
        x,
        THREE.MathUtils.lerp(0.939, upper, v),
        rear - 0.17 * (Math.abs(x) / 0.84) ** 3,
      ];
    },
    paint,
    100,
    8,
  );
  mapped(valance, valanceMat, -0.009);
  tube(
    group,
    valance.getPoints(40).map((p) => face(p.x, p.y, 0.001)),
    0.0037,
    black,
  );
  // The lower valance curls under the car, leaving no open white slab at its base.
  surface(
    group,
    (u, v) => {
      const x = (u * 2 - 1) * 0.757,
        p = face(x, 0.3, -0.009);
      return [x, p[1] - 0.015 * Math.sin(v * Math.PI), p[2] - v * 0.16];
    },
    valanceMat,
    72,
    10,
  );
  const trunkBar = bodyOutline([
    [-0.43, 0.878],
    [0, 0.87],
    [0.43, 0.878],
    [0.425, 0.855],
    [0, 0.85],
    [-0.425, 0.855],
  ]);
  mapped(trunkBar, lensBlack, 0.005);
  tube(
    group,
    Array.from({ length: 61 }, (_, i) => {
      const x = ((i / 60) * 2 - 1) * 0.43;
      return face(x, 0.857 + 0.009 * (x / 0.43) ** 2, 0.007);
    }),
    0.0028,
    alloy,
  );
  for (const [i, side] of [-1, 1].entries()) {
    mapped(lamps[i], red, 0.004);
    mapped(lowerLamps[i], clear, 0.006);
    tube(
      group,
      lamps[i].getPoints(32).map((p) => face(p.x, p.y, 0.006)),
      0.0025,
      lensBlack,
    );
    // Red light guides over a clear fluted reflector, not rectangular red blocks.
    for (const y of [0.89, 0.907])
      tube(
        group,
        Array.from({ length: 35 }, (_, j) => {
          const x = side * (0.505 + (j / 34) * 0.309);
          return face(x, y + 0.012 * Math.sin((j / 34) * Math.PI), 0.009);
        }),
        0.0035,
        red,
      );
    for (let j = 0; j < 20; j++) {
      const x = side * (0.605 + j * 0.011);
      tube(
        group,
        [face(x, 0.822 + 0.007 * (j / 20), 0.009), face(x, 0.859, 0.009)],
        0.0007,
        j % 3 === 0 ? lensBlack : alloy,
      );
    }
    mapped(reflectors[i], lensBlack, 0.002);
    mapped(
      bodyOutline(
        [
          [0.753, 0.365],
          [0.746, 0.509],
          [0.77, 0.517],
          [0.779, 0.373],
        ].map(([x, y]) => [side * x, y]),
      ),
      red,
      0.004,
    );
    // Rear corner returns meet the quarter-panel edge with the same contour.
    surface(
      group,
      (u, v) => {
        const y = 0.3 + u * 0.641,
          p = sidePoint(sideRear, y, side),
          q = face(side * width(y), y);
        return [
          THREE.MathUtils.lerp(p[0], q[0], v),
          y,
          THREE.MathUtils.lerp(p[2], q[2], v),
        ];
      },
      paint,
      48,
      16,
    );
    const sideLamp = new THREE.Shape();
    sideLamp.moveTo(3.17, 0.917);
    sideLamp.quadraticCurveTo(3.25, 0.957, 3.36, 0.947);
    sideLamp.lineTo(sideRear, 0.934);
    sideLamp.lineTo(sideRear, 0.831);
    sideLamp.quadraticCurveTo(3.35, 0.861, 3.17, 0.917);
    sideLamp.closePath();
    const sideSample = (z: number, y: number, o = 0): P3 => {
      const p = sidePoint(z, y, side);
      return [p[0] + side * o, p[1], p[2]];
    };
    bodyPatch(k, group, sideLamp, red, (z, y) => sideSample(z, y, 0.004));
    const lower = new THREE.Shape();
    lower.moveTo(3.29, 0.885);
    lower.quadraticCurveTo(3.4, 0.874, sideRear, 0.868);
    lower.lineTo(sideRear, 0.837);
    lower.quadraticCurveTo(3.37, 0.866, 3.29, 0.885);
    lower.closePath();
    bodyPatch(k, group, lower, clear, (z, y) => sideSample(z, y, 0.006));
    tube(
      group,
      sideLamp.getPoints(32).map((p) => sideSample(p.x, p.y, 0.006)),
      0.0025,
      lensBlack,
    );
    for (let j = 0; j < 14; j++) {
      const z = 3.385 + j * 0.01;
      tube(
        group,
        [
          sideSample(z, 0.855 + (sideRear - z) * 0.17, 0.008),
          sideSample(z, 0.872, 0.008),
        ],
        0.0007,
        alloy,
      );
    }
  }
  // Inset, stamped plate pocket with a correctly sized US plate frame.
  box(group, [0.314, 0.16, 0.01], face(0, 0.7, 0.007), black, 0.008);
  const plate = material('#d2d6d3', 0.18, 0.44);
  box(group, [0.295, 0.144, 0.005], face(0, 0.7, 0.014), plate, 0.006);
  for (const x of [-0.113, 0.113])
    box(group, [0.007, 0.007, 0.005], face(x, 0.757, 0.017), alloy, 0.001);
  const font = new FontLoader().parse(badgeFont);
  for (const [text, x, y, size] of [
    ['COROLLA', -0.63, 0.714, 0.02],
    ['LE', 0.526, 0.723, 0.024],
  ] as const) {
    const letters = new TextGeometry(text, {
      font,
      size,
      depth: 0.0015,
      curveSegments: 5,
      bevelEnabled: false,
    });
    const vertices = letters.getAttribute('position');
    for (let i = 0; i < vertices.count; i++) {
      const px = x + vertices.getX(i) + vertices.getY(i) * 0.25,
        py = y + vertices.getY(i),
        pz = vertices.getZ(i);
      vertices.setXYZ(i, px, py, face(px, py, 0.006)[2] + pz);
    }
    letters.computeVertexNormals();
    mesh(group, letters, alloy);
  }
  // Continuous U-shaped trunk shut line passes around the lamp and plate recess.
  const seam: P3[] = [];
  for (const [x, y] of [
    [-0.725, 0.938],
    [-0.724, 0.823],
    [-0.701, 0.71],
    [-0.655, 0.604],
    [-0.565, 0.576],
    [0, 0.574],
    [0.565, 0.576],
    [0.655, 0.604],
    [0.701, 0.71],
    [0.724, 0.823],
    [0.725, 0.938],
  ])
    seam.push([x, y, 0]);
  const seamCurve = new THREE.CatmullRomCurve3(
    seam.map((p) => new THREE.Vector3(...p)),
  );
  tube(
    group,
    seamCurve.getPoints(160).map((p) => face(p.x, p.y, 0.003)),
    0.0016,
    k.steel,
  );
  for (const [r, sx, sy, y] of [
    [0.031, 1.35, 1, 0.914],
    [0.024, 0.48, 1, 0.914],
    [0.023, 1.42, 0.4, 0.922],
  ]) {
    const badge = mesh(
      group,
      new THREE.TorusGeometry(r, 0.0026, 8, 56),
      alloy,
      face(0, y, 0.01),
    );
    badge.scale.set(sx, sy, 1);
  }
}
