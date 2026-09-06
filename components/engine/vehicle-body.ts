import * as THREE from 'three';
import { modelKit, batchVehicleModel } from './vehicle-model';
import { createCorollaShell } from './corolla-shell';

export function createVehicleBody() {
  const group = new THREE.Group();
  group.name = 'corolla-reference-body';
  const k = modelKit();
  const { box, mesh, bar, black, alloy } = k;
  const shell = createCorollaShell(k, group);
  // Cabin furniture is visible through the glazing, with no bright distraction.
  for (const side of [-1, 1]) {
    box(group, [0.4, 0.13, 0.48], [side * 0.38, 0.41, 1.26], black, 0.05);
    const back = box(
      group,
      [0.405, 0.52, 0.14],
      [side * 0.38, 0.7, 1.48],
      black,
      0.052,
    );
    back.rotation.x = -0.12;
    box(group, [0.23, 0.17, 0.095], [side * 0.38, 1.022, 1.52], black, 0.045);
    box(group, [0.42, 0.14, 0.42], [side * 0.37, 0.43, 2.27], black, 0.04);
    box(group, [0.43, 0.43, 0.12], [side * 0.37, 0.69, 2.45], black, 0.045);
    box(group, [0.2, 0.14, 0.09], [side * 0.37, 0.955, 2.46], black, 0.04);
  }
  box(group, [1.36, 0.185, 0.285], [0, 0.79, 0.83], black, 0.04);
  box(group, [0.17, 0.023, 0.13], [0, 0.91, 0.845], black, 0.015);
  const steering = mesh(
    group,
    new THREE.TorusGeometry(0.16, 0.012, 10, 44),
    black,
    [-0.37, 0.843, 0.98],
  );
  steering.rotation.x = -0.5;
  bar(group, [-0.47, 0.84, 0.98], [-0.27, 0.84, 0.98], 0.009, alloy);
  batchVehicleModel(group);
  // Large painted panels should not receive the engine's tightly cropped shadow map.
  group.traverse((object) => {
    if (object instanceof THREE.Mesh && object.material === k.paint)
      object.receiveShadow = false;
  });
  return {
    group,
    hood: shell.hood,
    materials: k.materials,
    setHood: shell.setHood,
  };
}
