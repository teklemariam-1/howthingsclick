import * as THREE from 'three';
import { modelKit, batchVehicleModel } from './vehicle-model';
import { createCorollaShell } from './corolla-shell';
import { createVehicleCabin } from './vehicle-cabin';

export function createVehicleBody() {
  const group = new THREE.Group();
  group.name = 'corolla-reference-body';
  const k = modelKit();
  const shell = createCorollaShell(k, group);
  createVehicleCabin(k, group);
  batchVehicleModel(group);
  return {
    group,
    hood: shell.hood,
    materials: k.materials,
    parts: k.parts,
    setHood: shell.setHood,
  };
}
