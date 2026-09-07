import * as THREE from 'three';
import type { ModelKit, P3 } from './vehicle-model';

export function bodyOutline(points: number[][]) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(([x, y]) => shape.lineTo(x, y));
  shape.closePath();
  return shape;
}

// Densify straight outline edges before applying the tube spline. Otherwise a
// long, sparsely sampled door edge bows away from its painted panel.
export function outlineTube(
  k: ModelKit,
  parent: THREE.Object3D,
  points: P3[],
  radius: number,
  material: THREE.Material,
) {
  const dense: P3[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = new THREE.Vector3(...points[i]),
      b = new THREE.Vector3(...points[i + 1]);
    const steps = Math.max(1, Math.ceil(a.distanceTo(b) / 0.012));
    for (let j = 0; j < steps; j++)
      dense.push(
        a
          .clone()
          .lerp(b, j / steps)
          .toArray() as P3,
      );
  }
  dense.push(points[points.length - 1]);
  return k.tube(parent, dense, radius, material);
}

// Subdivide in panel coordinates before projecting onto the curved body. This
// preserves openings without large flat triangles across the painted surface.
export function bodyPatch(
  k: ModelKit,
  parent: THREE.Group,
  shape: THREE.Shape,
  material: THREE.Material,
  sample: (x: number, y: number) => P3,
  subdivisions = 3,
) {
  const initial = new THREE.ShapeGeometry(shape, 24).toNonIndexed();
  const source = Array.from(initial.getAttribute('position').array);
  initial.dispose();
  const triangles: number[] = [];
  const threshold = (0.035 * 2 ** (3 - subdivisions)) ** 2;
  const length = (a: number[], b: number[]) =>
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  const split = (a: number[], b: number[], c: number[], depth: number) => {
    const ab = length(a, b),
      bc = length(b, c),
      ca = length(c, a),
      longest = Math.max(ab, bc, ca);
    if (longest <= threshold || depth === 14) {
      triangles.push(...a, ...b, ...c);
      return;
    }
    // Bisect the longest edge only. Long, thin ear-clipped triangles do not
    // multiply into thousands of redundant tiny triangles along panel borders.
    if (longest === ab) {
      const m = a.map((v, j) => (v + b[j]) / 2);
      split(a, m, c, depth + 1);
      split(m, b, c, depth + 1);
    } else if (longest === bc) {
      const m = b.map((v, j) => (v + c[j]) / 2);
      split(a, b, m, depth + 1);
      split(a, m, c, depth + 1);
    } else {
      const m = c.map((v, j) => (v + a[j]) / 2);
      split(a, b, m, depth + 1);
      split(m, b, c, depth + 1);
    }
  };
  for (let i = 0; i < source.length; i += 9)
    split(
      source.slice(i, i + 3),
      source.slice(i + 3, i + 6),
      source.slice(i + 6, i + 9),
      0,
    );
  const positions: number[] = [],
    normals: number[] = [],
    uv: number[] = [];
  for (let i = 0; i < triangles.length; i += 3) {
    const x = triangles[i],
      y = triangles[i + 1],
      e = 0.0001;
    positions.push(...sample(x, y));
    const dx = new THREE.Vector3(...sample(x + e, y)).sub(
      new THREE.Vector3(...sample(x - e, y)),
    );
    const dy = new THREE.Vector3(...sample(x, y + e)).sub(
      new THREE.Vector3(...sample(x, y - e)),
    );
    const n = dx.cross(dy).normalize();
    normals.push(n.x, n.y, n.z);
    uv.push(x, y);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return k.mesh(parent, geometry, material);
}
