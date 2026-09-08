import * as T from 'three';
import { box, cylinder, material } from './geometry';
// Illustrative road wheel. Dimensions are modeling parameters, not claimed OEM specifications.
export const WHEEL_RADIUS = 0.382;
export const TIRE_WIDTH = 0.24;
export function createRoadWheel(side: number, gold: T.Material) {
  const group = new T.Group();
  group.name = 'Complete road wheel';
  const rubber = material('#1b1e20', 0, 0.86),
    tread = material('#24272a', 0, 0.94),
    alloy = material('#737d81', 0.86, 0.27),
    inner = material('#29343a', 0.72, 0.37),
    steel = material('#9ba3a3', 0.9, 0.44),
    black = material('#11171a', 0.1, 0.7);
  // Broad crown, rounded shoulders, reinforced sidewalls and an actual bead seat.
  const profile: [number, number][] = [
    [0.258, -0.09],
    [0.27, -0.112],
    [0.297, -0.12],
    [0.332, -0.12],
    [0.356, -0.113],
    [0.374, -0.099],
    [0.381, -0.087],
    [0.382, -0.066],
    [0.382, -0.064],
    [0.376, -0.062],
    [0.376, -0.058],
    [0.382, -0.056],
    [0.382, -0.023],
    [0.376, -0.021],
    [0.376, -0.017],
    [0.382, -0.015],
    [0.382, 0.015],
    [0.376, 0.017],
    [0.376, 0.021],
    [0.382, 0.023],
    [0.382, 0.056],
    [0.376, 0.058],
    [0.376, 0.062],
    [0.382, 0.064],
    [0.382, 0.087],
    [0.374, 0.099],
    [0.356, 0.113],
    [0.332, 0.12],
    [0.297, 0.12],
    [0.27, 0.112],
    [0.258, 0.09],
    [0.258, -0.09],
  ];
  const tire = new T.Mesh(
    new T.LatheGeometry(
      profile.map((p) => new T.Vector2(...p)),
      128,
    ),
    rubber,
  );
  tire.rotation.x = Math.PI / 2;
  tire.castShadow = true;
  tire.receiveShadow = true;
  tire.name = 'Road tire — flat tread and sidewall';
  group.add(tire);
  // Recessed transverse sipes across five tread ribs, with staggered pitch.
  const grooves = new T.InstancedMesh(
    new T.BoxGeometry(0.0025, 0.0018, 0.029),
    black,
    5 * 88,
  );
  const dummy = new T.Object3D();
  let k = 0;
  for (let row = 0; row < 5; row++)
    for (let i = 0; i < 88; i++) {
      const a = ((i + (row % 2) * 0.4) * Math.PI * 2) / 88;
      dummy.position.set(
        Math.sin(a) * 0.382,
        Math.cos(a) * 0.382,
        (row - 2) * 0.038,
      );
      dummy.rotation.set(0, 0, -a + 0.14 * (row % 2 ? 1 : -1));
      dummy.updateMatrix();
      grooves.setMatrixAt(k++, dummy.matrix);
    }
  grooves.name = 'Recessed tread sipes';
  group.add(grooves);
  for (const sign of [-1, 1]) {
    for (const r of [0.272, 0.306, 0.35]) {
      const ring = new T.Mesh(new T.TorusGeometry(r, 0.0012, 6, 128), tread);
      ring.position.z = sign * 0.1205;
      group.add(ring);
    }
  }
  // The rim remains present when the detachable gold aero cover is hidden.
  const barrel = new T.Mesh(
    new T.CylinderGeometry(0.26, 0.26, 0.201, 96, 1, true),
    inner,
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.name = 'Alloy rim barrel';
  group.add(barrel);
  for (const z of [-0.102, 0.102]) {
    const bead = new T.Mesh(new T.TorusGeometry(0.261, 0.005, 8, 96), alloy);
    bead.position.z = z;
    group.add(bead);
  }
  const face = side * 0.108;
  const hub = cylinder(
    group,
    0.062,
    0.062,
    0.04,
    [0, 0, face - side * 0.025],
    alloy,
    40,
  );
  hub.rotation.x = Math.PI / 2;
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    for (const fork of [-1, 1]) {
      const start = new T.Vector2(Math.sin(a) * 0.055, Math.cos(a) * 0.055);
      const end = new T.Vector2(
        Math.sin(a + fork * 0.105) * 0.246,
        Math.cos(a + fork * 0.105) * 0.246,
      );
      const center = start.clone().add(end).multiplyScalar(0.5),
        length = start.distanceTo(end);
      const spoke = box(
        group,
        [0.034, length, 0.032],
        [center.x, center.y, face - side * 0.012],
        alloy,
        0.005,
      );
      spoke.rotation.z = -Math.atan2(end.x - start.x, end.y - start.y);
    }
    const bolt = cylinder(
      group,
      0.009,
      0.009,
      0.012,
      [Math.sin(a) * 0.041, Math.cos(a) * 0.041, face + side * 0.011],
      steel,
      6,
    );
    bolt.rotation.x = Math.PI / 2;
  }
  const rotor = cylinder(
    group,
    0.213,
    0.213,
    0.018,
    [0, 0, -side * 0.012],
    steel,
    96,
  );
  rotor.rotation.x = Math.PI / 2;
  rotor.name = 'Ventilated brake rotor';
  const hat = cylinder(
    group,
    0.084,
    0.084,
    0.036,
    [0, 0, side * 0.015],
    inner,
    48,
  );
  hat.rotation.x = Math.PI / 2;
  const vents = new T.InstancedMesh(
    new T.BoxGeometry(0.005, 0.006, 0.0205),
    black,
    40,
  );
  for (let i = 0; i < 40; i++) {
    const a = (i * Math.PI) / 20;
    dummy.position.set(Math.sin(a) * 0.21, Math.cos(a) * 0.21, -side * 0.012);
    dummy.rotation.set(0, 0, -a);
    dummy.updateMatrix();
    vents.setMatrixAt(i, dummy.matrix);
  }
  vents.name = 'Rotor ventilation slots';
  group.add(vents);
  const valve = cylinder(
    group,
    0.005,
    0.005,
    0.024,
    [0.151, 0.185, face + side * 0.012],
    black,
    12,
  );
  valve.rotation.x = Math.PI / 2;
  const cover = new T.Group();
  cover.name = 'Detachable Cybercab aero cover';
  group.add(cover);
  // Dish profile catches continuous reflections; it is not a stack of flat cylinders.
  const coverProfile: [number, number][] = [
    [0, side * 0.146],
    [0.025, side * 0.146],
    [0.062, side * 0.142],
    [0.15, side * 0.133],
    [0.252, side * 0.127],
    [0.265, side * 0.13],
    [0.32, side * 0.127],
    [0.348, side * 0.119],
    [0.351, side * 0.115],
    [0.348, side * 0.111],
    [0.32, side * 0.119],
    [0.25, side * 0.12],
    [0.05, side * 0.134],
    [0, side * 0.138],
  ];
  const cap = new T.Mesh(
    new T.LatheGeometry(
      coverProfile.map((p) => new T.Vector2(...p)),
      128,
    ),
    gold,
  );
  cap.rotation.x = Math.PI / 2;
  cap.castShadow = true;
  cover.add(cap);
  // Lathe's positive axis becomes +Z after the rotation; profile orientation is intentional.
  const capLine = new T.Mesh(new T.TorusGeometry(0.336, 0.0018, 6, 128), inner);
  capLine.position.z = side * 0.124;
  cover.add(capLine);
  return { group, cover, tire, profile };
}
