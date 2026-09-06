import * as THREE from 'three';
import type { ModelKit, P3 } from './vehicle-model';

// The fascia, lamp recesses and grille share one curved surface. All dimensions
// are in metres; u moves around the bumper from centre front to either fender.
export function createCorollaFascia(
  k: ModelKit,
  parent: THREE.Group,
  front: number,
  sidePoint: (z: number, y: number, side: number) => P3,
) {
  const { mesh, tube, surface, paint, black, alloy } = k;
  const reach = 0.56;
  const height = (u: number) => 0.734 + 0.083 * Math.abs(u) ** 2;
  const toe = (y: number) =>
    0.105 * (1 - THREE.MathUtils.smoothstep(y, 0.22, 0.54));
  const face = (u: number, y: number, offset = 0): P3 => {
    const side = Math.sign(u) || 1,
      a = (Math.abs(u) * Math.PI) / 2;
    const edge = sidePoint(front + reach, y, side);
    return [
      Math.sin(a) * (Math.abs(edge[0]) + offset) * side,
      y,
      front + reach * (1 - Math.cos(a)) + toe(y) - Math.cos(a) * offset,
    ];
  };
  function mapped(shape: THREE.Shape, material: THREE.Material, offset = 0) {
    // Subdivide triangles before curving them; a single ear-clipped triangle
    // across the bumper would otherwise create large, flat facets.
    const initial = new THREE.ShapeGeometry(shape, 32).toNonIndexed();
    let triangles = Array.from(initial.getAttribute('position').array);
    initial.dispose();
    for (let level = 0; level < 4; level++) {
      const next: number[] = [];
      for (let i = 0; i < triangles.length; i += 9) {
        const a = triangles.slice(i, i + 3),
          b = triangles.slice(i + 3, i + 6),
          c = triangles.slice(i + 6, i + 9);
        const ab = a.map((v, j) => (v + b[j]) / 2),
          bc = b.map((v, j) => (v + c[j]) / 2),
          ca = c.map((v, j) => (v + a[j]) / 2);
        next.push(
          ...a,
          ...ab,
          ...ca,
          ...ab,
          ...b,
          ...bc,
          ...ca,
          ...bc,
          ...c,
          ...ab,
          ...bc,
          ...ca,
        );
      }
      triangles = next;
    }
    const positions: number[] = [],
      normals: number[] = [];
    for (let i = 0; i < triangles.length; i += 3) {
      const u = triangles[i],
        y = triangles[i + 1],
        e = 0.0001;
      positions.push(...face(u, y, offset));
      const du = new THREE.Vector3(...face(u + e, y, offset)).sub(
        new THREE.Vector3(...face(u - e, y, offset)),
      );
      const dy = new THREE.Vector3(...face(u, y + e, offset)).sub(
        new THREE.Vector3(...face(u, y - e, offset)),
      );
      const n = du.cross(dy).normalize();
      // ShapeGeometry is CCW in (u,y), so these normals follow its winding.
      normals.push(n.x, n.y, n.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    g.setAttribute(
      'uv',
      new THREE.Float32BufferAttribute(
        positions.flatMap((_, i) =>
          i % 3 === 0 ? [positions[i], positions[i + 1]] : [],
        ),
        2,
      ),
    );
    return mesh(parent, g, material);
  }
  function polygon(points: number[][]) {
    const p = new THREE.Shape();
    p.moveTo(points[0][0], points[0][1]);
    points.slice(1).forEach(([x, y]) => p.lineTo(x, y));
    p.closePath();
    return p;
  }
  const outer = new THREE.Shape();
  outer.moveTo(-1, 0.224);
  outer.lineTo(1, 0.224);
  outer.lineTo(1, height(1));
  for (let i = 1; i <= 80; i++) {
    const u = 1 - i / 40;
    outer.lineTo(u, height(u));
  }
  outer.closePath();
  const lampOutline = [
    [0.265, 0.708],
    [0.5, 0.724],
    [0.735, 0.773],
    [0.983, 0.811],
    [0.73, 0.616],
    [0.62, 0.65],
    [0.46, 0.669],
    [0.27, 0.681],
  ];
  const lamps = [-1, 1].map((side) =>
    polygon(lampOutline.map(([u, y]) => [u * side, y])),
  );
  const grille = new THREE.Shape();
  grille.moveTo(-0.35, 0.605);
  grille.quadraticCurveTo(0, 0.617, 0.35, 0.605);
  grille.bezierCurveTo(0.385, 0.573, 0.42, 0.405, 0.522, 0.275);
  grille.quadraticCurveTo(0.533, 0.25, 0.49, 0.244);
  grille.lineTo(-0.49, 0.244);
  grille.quadraticCurveTo(-0.533, 0.25, -0.522, 0.275);
  grille.bezierCurveTo(-0.42, 0.405, -0.385, 0.573, -0.35, 0.605);
  grille.closePath();
  outer.holes.push(...lamps, grille);
  mapped(outer, paint);
  mapped(grille, black, -0.007);
  for (let j = 0; j < 8; j++) {
    const y = 0.274 + j * 0.043,
      width = 0.485 - (y - 0.274) * 0.43;
    const p: P3[] = [];
    for (let i = 0; i <= 48; i++)
      p.push(face(THREE.MathUtils.lerp(-width, width, i / 48), y, 0.001));
    tube(parent, p, 0.0035, black);
  }
  const lens = new THREE.MeshPhysicalMaterial({
    color: '#151c20',
    metalness: 0.35,
    roughness: 0.18,
    clearcoat: 1,
    side: THREE.DoubleSide,
  });
  const amber = new THREE.MeshStandardMaterial({
    color: '#b9650d',
    metalness: 0.22,
    roughness: 0.32,
    side: THREE.DoubleSide,
  });
  const reflector = new THREE.MeshStandardMaterial({
    color: '#a7b5b9',
    metalness: 0.86,
    roughness: 0.24,
    side: THREE.DoubleSide,
  });
  k.materials.push(lens, amber, reflector);
  for (const [i, side] of [-1, 1].entries()) {
    mapped(lamps[i], lens, 0.0015);
    tube(
      parent,
      lamps[i].getPoints(32).map((p) => face(p.x, p.y, 0.004)),
      0.003,
      black,
    );
    // Low-profile rectangular LED reflector modules, set inside the lamp lens.
    for (const u of [0.38, 0.52, 0.65]) {
      const top = 0.705 + Math.max(0, u - 0.4) * 0.17,
        bottom = top - 0.035;
      mapped(
        polygon([
          [side * (u - 0.046), bottom],
          [side * (u + 0.046), bottom + 0.007],
          [side * (u + 0.044), top],
          [side * (u - 0.045), top - 0.003],
        ]),
        reflector,
        0.005,
      );
      mapped(
        polygon([
          [side * (u - 0.032), bottom + 0.009],
          [side * (u + 0.028), bottom + 0.015],
          [side * (u + 0.03), top - 0.01],
          [side * (u - 0.03), top - 0.012],
        ]),
        lens,
        0.006,
      );
    }
    const brow: P3[] = [];
    for (let j = 0; j <= 40; j++) {
      const u = THREE.MathUtils.lerp(0.276, 0.77, j / 40);
      brow.push(
        face(side * u, 0.695 + 0.095 * ((u - 0.276) / 0.494) ** 1.7, 0.008),
      );
    }
    tube(parent, brow, 0.004, alloy);
    mapped(
      polygon([
        [side * 0.92, 0.79],
        [side * 0.955, 0.799],
        [side * 0.752, 0.636],
        [side * 0.753, 0.674],
      ]),
      amber,
      0.006,
    );
    // Pressed bumper cheek folds from the lamp heel into the low corner return.
    const crease: P3[] = [];
    for (const [u, y] of [
      [0.73, 0.612],
      [0.69, 0.515],
      [0.66, 0.449],
      [0.62, 0.347],
      [0.64, 0.257],
    ])
      crease.push(face(side * u, y, 0.002));
    tube(parent, crease, 0.0018, k.steel);
    surface(
      parent,
      (u, v) => {
        const q = face(
          side * THREE.MathUtils.lerp(0.55, 0.99, u),
          0.242,
          0.001,
        );
        return [q[0], q[1] + 0.013 * Math.sin(v * Math.PI), q[2] + v * 0.058];
      },
      paint,
      48,
      8,
    );
  }
  const upper: P3[] = [];
  for (let i = 0; i <= 50; i++)
    upper.push(
      face(
        THREE.MathUtils.lerp(-0.28, 0.28, i / 50),
        0.686 - 0.009 * Math.sin((i / 50) * Math.PI),
        0.005,
      ),
    );
  tube(parent, upper, 0.01, black);
  const logoBack = mesh(parent, new THREE.SphereGeometry(1, 32, 16), black, [
    0,
    0.683,
    front - 0.008,
  ]);
  logoBack.scale.set(0.045, 0.031, 0.009);
  for (const [r, sx, sy, y, z] of [
    [0.027, 1.45, 1, 0.683, front - 0.019],
    [0.021, 0.55, 1, 0.683, front - 0.023],
    [0.021, 1.42, 0.45, 0.69, front - 0.025],
  ]) {
    const badge = mesh(
      parent,
      new THREE.TorusGeometry(r, 0.003, 8, 48),
      alloy,
      [0, y, z],
    );
    badge.scale.set(sx, sy, 1);
  }
  return { face, edgeZ: front + reach, height, toe };
}
