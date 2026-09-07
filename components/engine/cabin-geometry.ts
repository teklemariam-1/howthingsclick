import * as THREE from 'three';
import type { ModelKit, P3 } from './vehicle-model';
import { bodyPatch } from './body-surface';

// A moulded trim panel needs a rear skin and returns around its outline.
// Keep the same mapped front contour while giving exposed edges real depth.
export function mouldedPanel(
  k: ModelKit,
  parent: THREE.Group,
  shape: THREE.Shape,
  material: THREE.Material,
  sample: (x: number, y: number) => P3,
  rearOffset: P3,
  subdivisions = 3,
) {
  const front = bodyPatch(k, parent, shape, material, sample, subdivisions);
  const rear = (x: number, y: number): P3 => {
    const p = sample(x, y);
    return p.map((n, i) => n + rearOffset[i]) as P3;
  };
  bodyPatch(k, parent, shape, material, rear, subdivisions);
  const contours = shape.extractPoints(24);
  for (const outline of [contours.shape, ...contours.holes]) {
    for (let i = 0; i < outline.length; i++) {
      const a = outline[i],
        b = outline[(i + 1) % outline.length];
      if (a.distanceToSquared(b) < 1e-12) continue;
      k.surface(
        parent,
        (u, v): P3 => {
          const p = sample(
            THREE.MathUtils.lerp(a.x, b.x, u),
            THREE.MathUtils.lerp(a.y, b.y, u),
          );
          return p.map((n, j) => n + rearOffset[j] * v) as P3;
        },
        material,
        Math.max(2, Math.ceil(a.distanceTo(b) / 0.025)),
        2,
      );
    }
  }
  return front;
}
