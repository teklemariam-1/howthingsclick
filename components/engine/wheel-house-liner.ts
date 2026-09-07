import * as THREE from 'three';
import type { ModelKit, P3 } from './vehicle-model';

export function createWheelHouseLiner(
  k: ModelKit,
  root: THREE.Group,
  side: number,
  axle: number,
  sidePoint: (z: number, y: number, side: number) => P3,
  material: THREE.Material,
) {
  const front = axle === 0;
  const name = `${side < 0 ? 'Left' : 'Right'} ${front ? 'front' : 'rear'}`;
  const liner = k.part(root, {
    id: `car-${side < 0 ? 'left' : 'right'}-${front ? 'front' : 'rear'}-wheel-liner`,
    name: `${name} wheel-house liner`,
    system: 'body',
    offset: [side * 0.59, 0.15, front ? -0.35 : 0.35],
    stage: 2,
    material: 'Moulded polymer and retaining clips',
    description:
      'A curved splash liner follows the wheel opening and shields the body cavity and wiring from spray and stones. Its retaining clips attach it independently of the painted outer panel.',
  });
  const point = (u: number, v: number, inset = 0): P3 => {
    const angle = THREE.MathUtils.lerp(-0.27, Math.PI + 0.27, u);
    const radius = 0.347 + 0.012 * Math.sin(v * Math.PI) + inset;
    const y = 0.316 + Math.sin(angle) * radius;
    const z = axle - Math.cos(angle) * radius;
    const outer = sidePoint(z, y, side);
    return [
      THREE.MathUtils.lerp(
        outer[0] - side * 0.006,
        side * (front ? 0.54 : 0.45),
        v,
      ),
      y,
      z,
    ];
  };
  k.surface(liner, (u, v) => point(u, v), material, 112, 30);
  k.surface(liner, (u, v) => point(u, v, 0.003), material, 112, 30);
  // The outer return closes the visible gap between the curved liner and the
  // painted wheel opening. Without this flange the inner steel shows through.
  k.surface(
    liner,
    (u, v) => {
      const angle = THREE.MathUtils.lerp(-0.27, Math.PI + 0.27, u);
      const radius = THREE.MathUtils.lerp(0.343, 0.377, v);
      const y = 0.316 + Math.sin(angle) * radius;
      const z = axle - Math.cos(angle) * radius;
      const p = sidePoint(z, y, side);
      return [p[0] - side * 0.0025, y, p[2]];
    },
    material,
    112,
    5,
  );
  for (const edge of [0, 1])
    k.surface(liner, (u, v) => point(u, edge, v * 0.003), material, 112, 2);
  for (const edge of [0, 1])
    k.surface(liner, (u, v) => point(edge, u, v * 0.003), material, 36, 2);
  for (const t of [0.045, 0.18, 0.36, 0.52, 0.7, 0.88, 0.96]) {
    const p = point(t, 0.065);
    const clip = k.mesh(
      liner,
      new THREE.CylinderGeometry(0.006, 0.005, 0.003, 16),
      k.black,
      p,
    );
    clip.rotation.z = Math.PI / 2;
  }
  return liner;
}
