import * as THREE from 'three';
import type { ModelKit, P3 } from './vehicle-model';
import { headlampProjector } from './lamp-optics';
import { bodyOutline, bodyPatch, outlineTube } from './body-surface';

// US Corolla LE fascia reconstructed from the exact EchoPark front and corner
// photographs: broad horizontal slats, hooked lamps, and folded bumper cheeks.
export function createCorollaFascia(
  k: ModelKit,
  root: THREE.Group,
  front: number,
  sidePoint: (z: number, y: number, side: number) => P3,
) {
  const { mesh, tube, surface, paint, black, alloy } = k;
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
      system: 'body',
      offset,
      stage,
      description,
      material: 'Paint, polymer, glass and metal',
    });
  const bumper = part(
    'front-bumper',
    'Front bumper cover',
    [0, 0.12, -1.3],
    1,
    'The moulded painted cover forms the rounded nose and large lower intake opening. The crash beam is a separate structure behind it.',
  );
  const grilleGroup = part(
    'front-grille',
    'Front grille and emblem',
    [0, 0.12, -1.8],
    0,
    'Horizontal slats admit air to the cooling pack. The upper grille carries the Toyota emblem.',
  );
  let parent = bumper;
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
    slats = material('#151c20', 0.06, 0.43);
  const lens = material('#12191d', 0.35, 0.16),
    chrome = material('#cbd3d5', 0.88, 0.17),
    reflector = material('#5c6c72', 0.75, 0.24);
  slats.clearcoat = 0.25;
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
    [0.962, 0.775],
    [0.87, 0.728],
    [0.76, 0.64],
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
    s.moveTo(side * 0.872, 0.412);
    s.bezierCurveTo(
      side * 0.837,
      0.424,
      side * 0.803,
      0.391,
      side * 0.804,
      0.364,
    );
    s.lineTo(side * 0.825, 0.293);
    s.lineTo(side * 0.844, 0.302);
    s.lineTo(side * 0.829, 0.365);
    s.quadraticCurveTo(side * 0.833, 0.393, side * 0.879, 0.39);
    s.closePath();
    return s;
  });
  outer.holes.push(...lamps, grille, upper, ...corners);
  mapped(outer, paint);
  parent = grilleGroup;
  mapped(grille, black, -0.06);
  const aperture = grille.getPoints(96);
  // Close the full intake perimeter between the painted mouth and its recessed
  // backing. Otherwise bright bodywork shows between the slats at oblique angles.
  surface(
    parent,
    (u, v) => {
      const index = u * (aperture.length - 1),
        i = Math.min(aperture.length - 2, Math.floor(index));
      const p = aperture[i].clone().lerp(aperture[i + 1], index - i);
      return face(p.x, p.y, THREE.MathUtils.lerp(0.001, -0.062, v));
    },
    trim,
    240,
    6,
  );
  const apertureHalfWidth = (y: number) => {
    let half = 0;
    for (let i = 0; i < aperture.length - 1; i++) {
      const a = aperture[i],
        b = aperture[i + 1];
      if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y))
        half = Math.max(half, a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y));
    }
    return half - 0.01;
  };
  tube(
    parent,
    grille.getPoints(40).map((p) => face(p.x, p.y, 0.002)),
    0.006,
    trim,
  );
  // Slat sections catch highlights; the radiator remains recessed behind them.
  for (const y of [0.267, 0.294, 0.321, 0.348, 0.375, 0.402, 0.429, 0.55]) {
    const half = apertureHalfWidth(y + 0.018);
    surface(
      parent,
      (u, v) => {
        const x = THREE.MathUtils.lerp(-half, half, u),
          bow = 0.012 * (1 - (x / half) ** 2);
        return face(
          x,
          y + bow + 0.012 * (v - 0.5),
          -0.017 -
            0.025 * Math.sin(Math.PI * u) +
            0.0035 * Math.sin(Math.PI * v),
        );
      },
      slats,
      72,
      6,
    );
  }
  surface(
    parent,
    (u, v) => {
      const y = 0.456 + v * 0.071,
        half = apertureHalfWidth(y);
      return face(
        (u * 2 - 1) * half,
        y,
        -0.026 - 0.012 * Math.sin(Math.PI * u),
      );
    },
    trim,
    72,
    12,
  );
  surface(
    parent,
    (u, v) =>
      face(THREE.MathUtils.lerp(-0.467, 0.467, u), 0.546 + v * 0.025, -0.012),
    trim,
    64,
    5,
  );
  // The lower intake turns back into the bumper and has actual depth.
  surface(
    parent,
    (u, v) => {
      const x = (u * 2 - 1) * 0.647,
        p = face(x, 0.24 + 0.008 * Math.sin(u * Math.PI));
      return [p[0], p[1] + 0.018 * Math.sin(v * Math.PI), p[2] + v * 0.075];
    },
    trim,
    80,
    12,
  );
  for (const u of [-0.52, -0.26, 0, 0.26, 0.52])
    k.bar(
      parent,
      face(u, 0.285, -0.045),
      face(u * 0.75, 0.55, -0.045),
      0.005,
      trim,
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
    parent = part(
      `${side < 0 ? 'left' : 'right'}-headlamp`,
      `${side < 0 ? 'Left' : 'Right'} headlamp`,
      [side * 0.5, 0.3, -1.05],
      0,
      'The swept headlamp includes the projector, reflector surfaces and amber side marker.',
    );
    mapped(lamps[i], lens, -0.042);
    outlineTube(
      k,
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
    mapped(inner, chrome, -0.022);
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
    mapped(innerDark, reflector, -0.02);
    for (let j = 0; j < 24; j++) {
      const u = 0.32 + j * 0.012;
      const y = 0.692 + (u - 0.32) * 0.136;
      tube(
        parent,
        [
          face(side * u, y, -0.018),
          face(side * (u + 0.008), y + 0.009, -0.018),
        ],
        0.0008,
        chrome,
      );
    }
    const projectorCenter = face(side * 0.61, 0.724, -0.004);
    headlampProjector(k, parent, projectorCenter, side);
    const hook = bodyOutline(
      [
        [0.969, 0.795],
        [0.953, 0.782],
        [0.877, 0.739],
        [0.775, 0.653],
        [0.711, 0.627],
        [0.713, 0.648],
        [0.768, 0.677],
        [0.865, 0.758],
        [0.949, 0.8],
      ].map(([u, y]) => [side * u, y]),
    );
    mapped(hook, chrome, 0.004);
    const marker = bodyOutline(
      [
        [0.963, 0.79],
        [0.95, 0.782],
        [0.876, 0.741],
        [0.774, 0.657],
        [0.718, 0.633],
        [0.72, 0.643],
        [0.769, 0.671],
        [0.872, 0.752],
        [0.952, 0.795],
      ].map(([u, y]) => [side * u, y]),
    );
    mapped(marker, amber, 0.006);
    const edge = lamps[i].getPoints(36);
    surface(
      parent,
      (u, v) => {
        const idx = u * (edge.length - 1),
          i = Math.min(edge.length - 2, Math.floor(idx)),
          t = idx - i;
        const p = edge[i].clone().lerp(edge[i + 1], t);
        return face(p.x, p.y, THREE.MathUtils.lerp(-0.046, -0.004, v));
      },
      trim,
      160,
      5,
    );
    const lensMaterial = new THREE.MeshPhysicalMaterial({
      color: '#dae6e8',
      metalness: 0,
      roughness: 0.07,
      transparent: true,
      opacity: 0.12,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      side: THREE.DoubleSide,
      envMapIntensity: 1.2,
    });
    k.materials.push(lensMaterial);
    const cover = k.part(parent, {
      id: `car-${side < 0 ? 'left' : 'right'}-headlamp-lens`,
      name: `${side < 0 ? 'Left' : 'Right'} headlamp outer lens`,
      system: 'body',
      offset: [side * 0.12, 0.05, -0.3],
      stage: 0,
      material: 'Clear polycarbonate',
      description:
        'The shaped outer polycarbonate lens seals the projector and reflector optics from water and dust.',
    });
    bodyPatch(k, cover, lamps[i], lensMaterial, (u, y) => face(u, y, 0.01));
    parent = bumper;
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
  parent = grilleGroup;
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
