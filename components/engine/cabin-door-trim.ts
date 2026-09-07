import * as THREE from 'three';
import type { ModelKit, P3 } from './vehicle-model';
import type { CabinMaterials } from './cabin-materials';
import { bodyOutline, bodyPatch } from './body-surface';
import { mouldedPanel } from './cabin-geometry';

export function createCabinDoorTrim(
  k: ModelKit,
  parent: THREE.Group,
  side: number,
  front: boolean,
  shape: THREE.Shape,
  sidePoint: (z: number, y: number, side: number) => P3,
  m: CabinMaterials,
) {
  const { mesh, box, tube, surface } = k;
  const point = (z: number, y: number, depth = 0.056): P3 => {
    const p = sidePoint(z, y, side);
    return [p[0] - side * depth, y, p[2]];
  };
  mouldedPanel(k, parent, shape, m.dark, (z, y) => point(z, y), [
    side * 0.018,
    0,
    0,
  ]);
  const z0 = front ? 0.62 : 1.78,
    z1 = front ? 1.665 : 2.51;
  const pale = bodyOutline(
    front
      ? [
          [0.64, 0.78],
          [0.76, 0.845],
          [1.57, 0.853],
          [1.67, 0.781],
          [1.57, 0.651],
          [1.22, 0.682],
          [0.81, 0.692],
        ]
      : [
          [1.8, 0.777],
          [1.81, 0.85],
          [2.48, 0.851],
          [2.52, 0.786],
          [2.32, 0.643],
          [1.85, 0.68],
        ],
  );
  mouldedPanel(
    k,
    parent,
    pale,
    m.pale,
    (z, y) => point(z, y, 0.065 + 0.014 * Math.sin((y - 0.65) * 12)),
    [side * 0.008, 0, 0],
    3,
  );
  // Armrest slopes up into the pull handle; its upper surface is separate from
  // the sweeping pale panel and the deep lower map pocket.
  const arm = bodyOutline([
    [z0 + 0.1, 0.636],
    [z1 - 0.11, 0.666],
    [z1 - 0.14, 0.55],
    [z0 + 0.23, 0.52],
    [z0 + 0.09, 0.571],
  ]);
  mouldedPanel(
    k,
    parent,
    arm,
    m.soft,
    (z, y) => point(z, y, 0.089 + 0.064 * Math.sin((y - 0.52) * 20)),
    [side * 0.012, 0, 0],
    3,
  );
  surface(
    parent,
    (u, v) => {
      const z = THREE.MathUtils.lerp(z0 + 0.11, z1 - 0.13, u),
        y = 0.636 + 0.03 * u;
      return point(z, y, 0.074 + v * 0.067);
    },
    m.dark,
    48,
    12,
  );
  const handleZ = z0 + 0.22;
  const escutcheon = bodyOutline([
    [handleZ - 0.062, 0.781],
    [handleZ + 0.061, 0.776],
    [handleZ + 0.06, 0.734],
    [handleZ - 0.06, 0.734],
  ]);
  bodyPatch(k, parent, escutcheon, m.soft, (z, y) => point(z, y, 0.087), 1);
  tube(
    parent,
    [
      point(handleZ - 0.039, 0.752, 0.094),
      point(handleZ + 0.035, 0.753, 0.097),
      point(handleZ + 0.043, 0.764, 0.094),
    ],
    0.004,
    m.silver,
  );
  const pocket = bodyOutline([
    [z0 + 0.14, 0.456],
    [z1 - 0.12, 0.493],
    [z1 - 0.19, 0.325],
    [z0 + 0.15, 0.323],
    [z0 + 0.11, 0.377],
  ]);
  mouldedPanel(
    k,
    parent,
    pocket,
    m.dark,
    (z, y) => point(z, y, 0.109),
    [side * 0.01, 0, 0],
    2,
  );
  tube(
    parent,
    [
      point(z0 + 0.15, 0.453, 0.116),
      point(z0 + 0.4, 0.466, 0.117),
      point(z1 - 0.14, 0.491, 0.107),
    ],
    0.005,
    m.soft,
  );
  // Recessed speaker grille. Fine perforation geometry is kept low contrast.
  const speakerZ = front ? 0.89 : 2.34,
    speakerY = front ? 0.421 : 0.418;
  const center = point(speakerZ, speakerY, 0.114);
  const speaker = mesh(
    parent,
    new THREE.CircleGeometry(front ? 0.076 : 0.068, 48),
    m.soft,
    center,
  );
  speaker.rotation.y = (side * Math.PI) / 2;
  for (let row = -7; row <= 7; row++)
    for (let col = -7; col <= 7; col++)
      if (row * row + col * col < 48) {
        const p = point(speakerZ + col * 0.008, speakerY + row * 0.008, 0.116);
        const hole = mesh(
          parent,
          new THREE.CircleGeometry(0.0014, 5),
          m.dark,
          p,
        );
        hole.rotation.y = (side * Math.PI) / 2;
      }
  const switchZ = front ? 1.015 : 1.99;
  for (let j = 0; j < (front && side < 0 ? 4 : 1); j++) {
    const p = point(
      switchZ + Math.floor(j / 2) * 0.037,
      0.64,
      (j % 2) * 0.027 + 0.112,
    );
    const sw = box(parent, [0.022, 0.008, 0.027], p, m.gloss, 0.003);
    sw.rotation.x = -0.045;
    box(
      parent,
      [0.009, 0.001, 0.002],
      [p[0], p[1] + 0.005, p[2] - 0.005],
      m.silver,
      0.0005,
    );
  }
}
