import * as THREE from 'three';
import type { ModelKit, P3 } from './vehicle-model';
import { bodyOutline, bodyPatch, outlineTube } from './body-surface';

export function createDoorHardware(
  k: ModelKit,
  door: THREE.Group,
  side: number,
  front: boolean,
  shape: THREE.Shape,
  sample: (z: number, y: number, side: number) => P3,
) {
  const sideName = side < 0 ? 'left' : 'right',
    which = front ? 'front' : 'rear',
    label = `${side < 0 ? 'Left' : 'Right'} ${which}`;
  const z0 = front ? 0.63 : 1.72,
    z1 = front ? 1.42 : 2.28;
  const { box, bar, mesh, steel, alloy, black, paint } = k;
  const pos = (z: number, y: number, depth = 0.035): P3 => {
    const p = sample(z, y, side);
    p[0] -= side * depth;
    return p;
  };
  const inner = new THREE.Shape(shape.getPoints(24));
  inner.holes.push(
    bodyOutline([
      [z0, 0.37],
      [z1, 0.37],
      [z1, 0.72],
      [z0, 0.72],
    ]),
  );
  bodyPatch(k, door, inner, paint, (z, y) => pos(z, y, 0.027));
  outlineTube(
    k,
    door,
    inner.holes[0].getPoints().map((p) => pos(p.x, p.y, 0.032)),
    0.0035,
    steel,
  );
  const regulator = k.part(door, {
    id: `car-${sideName}-${which}-regulator`,
    name: `${label} window regulator`,
    system: 'electrical',
    offset: [side * 0.4, 0.08, 0],
    stage: 4,
    material: 'Steel, cables and electric motor',
    description:
      'A cable-driven regulator raises and lowers the main window along guide rails inside the door cavity.',
  });
  for (const z of [z0 + 0.08, z1 - 0.07]) {
    bar(regulator, pos(z, 0.38), pos(z, 0.82), 0.01, alloy);
    box(regulator, [0.018, 0.046, 0.07], pos(z, 0.73), black, 0.006);
  }
  bar(regulator, pos(z0 + 0.08, 0.4), pos(z1 - 0.07, 0.79), 0.002, steel);
  bar(regulator, pos(z1 - 0.07, 0.4), pos(z0 + 0.08, 0.79), 0.002, steel);
  const motor = mesh(
    regulator,
    new THREE.CylinderGeometry(0.038, 0.038, 0.026, 28),
    steel,
    pos((z0 + z1) / 2, 0.48),
  );
  motor.rotation.z = Math.PI / 2;
  box(
    regulator,
    [0.035, 0.045, 0.074],
    pos((z0 + z1) / 2 + 0.05, 0.48),
    black,
    0.01,
  );
  const latch = k.part(door, {
    id: `car-${sideName}-${which}-latch`,
    name: `${label} door latch and hinges`,
    system: 'body',
    offset: [side * 0.22, 0.05, 0.15],
    stage: 3,
    material: 'Steel',
    description:
      'Two hinge brackets support the door. A latch and internal linkage secure its rear edge to the body striker.',
  });
  const hingeZ = front ? 0.507 : 1.615;
  for (const y of [0.42, 0.77]) {
    box(latch, [0.047, 0.061, 0.029], pos(hingeZ, y, 0.055), steel, 0.006);
    bar(
      latch,
      pos(hingeZ, y - 0.039, 0.06),
      pos(hingeZ, y + 0.039, 0.06),
      0.006,
      alloy,
    );
  }
  box(latch, [0.045, 0.085, 0.035], pos(z1 + 0.02, 0.76, 0.043), steel, 0.008);
  bar(
    latch,
    pos(z1 + 0.02, 0.76, 0.043),
    pos(z1 - 0.11, 0.86, 0.043),
    0.003,
    steel,
  );
}
