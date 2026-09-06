import * as THREE from 'three';
import type { ModelKit, P3 } from './vehicle-model';
import { bodyOutline, bodyPatch } from './body-surface';

// US Corolla LE fascia reconstructed from the exact EchoPark front and corner
// photographs: broad horizontal slats, hooked lamps, and folded bumper cheeks.
export function createCorollaFascia(
  k: ModelKit,
  parent: THREE.Group,
  front: number,
  sidePoint: (z: number, y: number, side: number) => P3,
) {
  const { mesh, tube, surface, paint, black, alloy } = k;
  const reach = 0.56;
  const height = (u: number) => 0.742 + 0.075 * Math.abs(u) ** 2;
  const toe = (y: number) =>
    0.105 * (1 - THREE.MathUtils.smoothstep(y, 0.22, 0.54));
  const angleAtZ = (z: number) =>
    Math.acos(
      1 - THREE.MathUtils.clamp((z - front) / reach, 0, 1) ** (1 / 1.8),
    ) /
    (Math.PI / 2);
  const face = (u: number, y: number, offset = 0): P3 => {
    const side = Math.sign(u) || 1,
      a = Math.abs(u),
      angle = (a * Math.PI) / 2;
    const edge = sidePoint(front + reach, y, side);
    const cheek =
      0.033 *
      Math.exp(-(((a - 0.75) / 0.11) ** 2)) *
      Math.exp(-(((y - 0.46) / 0.082) ** 2));
    const foldY = 0.337 + (a - 0.69) * 0.3;
    const fold =
      0.015 *
      Math.exp(-(((y - foldY) / 0.014) ** 2)) *
      THREE.MathUtils.smoothstep(a, 0.68, 0.78) *
      (1 - THREE.MathUtils.smoothstep(a, 0.94, 1));
    return [
      side * Math.sin(angle) * (Math.abs(edge[0]) + offset),
      y,
      front +
        reach * (1 - Math.cos(angle)) ** 1.8 +
        toe(y) -
        cheek +
        fold -
        Math.cos(angle) * offset,
    ];
  };
  const mapped = (
    shape: THREE.Shape,
    mat: THREE.Material,
    offset = 0,
    subdivisions = 3,
  ) =>
    bodyPatch(
      k,
      parent,
      shape,
      mat,
      (u, y) => face(u, y, offset),
      subdivisions,
    );
  const material = (color: string, metalness: number, roughness: number) => {
    const m = new THREE.MeshPhysicalMaterial({
      color,
      metalness,
      roughness,
      clearcoat: 0.7,
      side: THREE.DoubleSide,
    });
    k.materials.push(m);
    return m;
  };
  const trim = material('#181e22', 0.12, 0.4),
    slats = material('#2a3033', 0.2, 0.32);
  const lens = material('#12191d', 0.35, 0.16),
    chrome = material('#cbd3d5', 0.88, 0.17),
    reflector = material('#5c6c72', 0.75, 0.24);
  const amber = material('#ba6c13', 0.24, 0.28);
  const outer = new THREE.Shape();
  outer.moveTo(-1, 0.224);
  outer.lineTo(1, 0.224);
  outer.lineTo(1, height(1));
  for (let i = 1; i <= 80; i++) {
    const u = 1 - i / 40;
    outer.lineTo(u, height(u));
  }
  outer.closePath();
  const lampPoints = [
    [0.263, 0.703],
    [0.45, 0.725],
    [0.66, 0.765],
    [0.98, 0.809],
    [0.962, 0.671],
    [0.708, 0.61],
    [0.694, 0.674],
    [0.48, 0.676],
    [0.273, 0.669],
  ];
  const lamps = [-1, 1].map((side) =>
    bodyOutline(lampPoints.map(([u, y]) => [side * u, y])),
  );
  const grille = new THREE.Shape();
  grille.moveTo(-0.423, 0.601);
  grille.quadraticCurveTo(0, 0.598, 0.423, 0.601);
  grille.bezierCurveTo(0.485, 0.597, 0.585, 0.38, 0.68, 0.28);
  grille.quadraticCurveTo(0.711, 0.241, 0.63, 0.234);
  grille.quadraticCurveTo(0, 0.218, -0.63, 0.234);
  grille.quadraticCurveTo(-0.711, 0.241, -0.68, 0.28);
  grille.bezierCurveTo(-0.585, 0.38, -0.485, 0.597, -0.423, 0.601);
  grille.closePath();
  const upper = bodyOutline([
    [-0.268, 0.704],
    [-0.18, 0.714],
    [0, 0.716],
    [0.18, 0.714],
    [0.268, 0.704],
    [0.249, 0.661],
    [0.084, 0.655],
    [0.062, 0.6],
    [-0.062, 0.6],
    [-0.084, 0.655],
    [-0.249, 0.661],
  ]);
  const corners = [-1, 1].map((side) => {
    const s = new THREE.Shape();
    s.moveTo(side * 0.987, 0.407);
    s.bezierCurveTo(
      side * 0.9,
      0.422,
      side * 0.789,
      0.317,
      side * 0.785,
      0.247,
    );
    s.lineTo(side * 0.807, 0.256);
    s.bezierCurveTo(side * 0.822, 0.307, side * 0.94, 0.39, side * 0.997, 0.38);
    s.closePath();
    return s;
  });
  outer.holes.push(...lamps, grille, upper, ...corners);
  mapped(outer, paint);
  mapped(grille, black, -0.027);
  tube(
    parent,
    grille.getPoints(40).map((p) => face(p.x, p.y, 0.002)),
    0.006,
    trim,
  );
  // Slat sections catch highlights; the radiator remains recessed behind them.
  for (let j = 0; j < 9; j++) {
    const y = 0.272 + j * 0.033,
      half = 0.664 - (y - 0.272) * 0.7;
    surface(
      parent,
      (u, v) => {
        const x = THREE.MathUtils.lerp(-half, half, u),
          bow = 0.012 * (1 - (x / half) ** 2);
        return face(
          x,
          y + bow + 0.012 * (v - 0.5),
          -0.009 + 0.004 * Math.sin(Math.PI * v),
        );
      },
      slats,
      72,
      6,
    );
  }
  surface(
    parent,
    (u, v) =>
      face(THREE.MathUtils.lerp(-0.467, 0.467, u), 0.546 + v * 0.025, -0.012),
    trim,
    64,
    5,
  );
  mapped(upper, trim, 0.001);
  for (const side of [-1, 1])
    for (let row = 0; row < 2; row++)
      for (let j = 0; j < 8; j++) {
        const u = side * (0.091 + j * 0.02),
          y = 0.678 + row * 0.017;
        const p: P3[] = [];
        for (let i = 0; i <= 6; i++) {
          const a = (i * Math.PI) / 3;
          p.push(face(u + 0.011 * Math.cos(a), y + 0.006 * Math.sin(a), 0.003));
        }
        tube(parent, p, 0.0013, slats);
      }
  for (const [i, side] of [-1, 1].entries()) {
    mapped(lamps[i], lens, -0.003);
    tube(
      parent,
      lamps[i].getPoints().map((p) => face(p.x, p.y, 0.002)),
      0.0023,
      black,
    );
    const inner = bodyOutline(
      [
        [0.277, 0.698],
        [0.47, 0.719],
        [0.675, 0.757],
        [0.627, 0.703],
        [0.49, 0.686],
        [0.297, 0.679],
      ].map(([u, y]) => [side * u, y]),
    );
    mapped(inner, chrome, 0.001);
    const innerDark = bodyOutline(
      [
        [0.302, 0.697],
        [0.47, 0.713],
        [0.645, 0.745],
        [0.612, 0.709],
        [0.484, 0.692],
        [0.32, 0.685],
      ].map(([u, y]) => [side * u, y]),
    );
    mapped(innerDark, reflector, 0.002);
    for (let j = 0; j < 24; j++) {
      const u = 0.32 + j * 0.012;
      const y = 0.692 + (u - 0.32) * 0.136;
      tube(
        parent,
        [
          face(side * u, y, 0.0035),
          face(side * (u + 0.008), y + 0.009, 0.0035),
        ],
        0.0008,
        chrome,
      );
    }
    const projector = new THREE.Shape();
    projector.absellipse(
      side * 0.759,
      0.731,
      0.055,
      0.026,
      0,
      Math.PI * 2,
      false,
      0,
    );
    mapped(projector, chrome, 0.002, 2);
    const glass = new THREE.Shape();
    glass.absellipse(
      side * 0.759,
      0.731,
      0.05,
      0.023,
      0,
      Math.PI * 2,
      false,
      0,
    );
    mapped(glass, lens, 0.004, 2);
    const sheen = new THREE.Shape();
    sheen.absellipse(
      side * 0.759,
      0.742,
      0.042,
      0.005,
      0,
      Math.PI * 2,
      false,
      0,
    );
    mapped(sheen, reflector, 0.005, 2);
    const hook = bodyOutline(
      [
        [0.967, 0.786],
        [0.944, 0.752],
        [0.905, 0.71],
        [0.755, 0.634],
        [0.73, 0.642],
        [0.871, 0.711],
        [0.934, 0.781],
      ].map(([u, y]) => [side * u, y]),
    );
    mapped(hook, chrome, 0.004);
    const marker = bodyOutline(
      [
        [0.965, 0.777],
        [0.946, 0.736],
        [0.911, 0.698],
        [0.753, 0.626],
        [0.755, 0.643],
        [0.894, 0.704],
        [0.95, 0.779],
      ].map(([u, y]) => [side * u, y]),
    );
    mapped(marker, amber, 0.006);
    mapped(corners[i], trim, -0.003);
    surface(
      parent,
      (u, v) => {
        const p = face(side * THREE.MathUtils.lerp(0.718, 0.987, u), 0.242);
        return [p[0], p[1] + 0.024 * Math.sin(Math.PI * v), p[2] + v * 0.048];
      },
      paint,
      48,
      8,
    );
  }
  const badgeBack = mesh(parent, new THREE.SphereGeometry(1, 36, 20), trim, [
    0,
    0.655,
    front - 0.007,
  ]);
  badgeBack.scale.set(0.085, 0.065, 0.009);
  for (const [r, sx, sy, y, z] of [
    [0.049, 1.23, 0.91, 0.655, front - 0.019],
    [0.034, 0.48, 1, 0.655, front - 0.023],
    [0.033, 1.52, 0.39, 0.666, front - 0.025],
  ]) {
    const badge = mesh(
      parent,
      new THREE.TorusGeometry(r, 0.0028, 8, 64),
      alloy,
      [0, y, z],
    );
    badge.scale.set(sx, sy, 1);
  }
  return { face, edgeZ: front + reach, height, toe, angleAtZ };
}
