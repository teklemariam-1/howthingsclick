import * as THREE from 'three';
import { modelKit, batchVehicleModel } from './vehicle-model';
import { createCorollaShell } from './corolla-shell';
import { createVehicleCabin } from './vehicle-cabin';
import { createCabinMaterials } from './cabin-materials';

export function createVehicleBody() {
  const group = new THREE.Group();
  group.name = 'corolla-reference-body';
  const k = modelKit();
  const materials = createCabinMaterials(k);
  const shell = createCorollaShell(k, group, materials);
  createVehicleCabin(k, group, materials);
  batchVehicleModel(group);
  return {
    group,
    hood: shell.hood,
    materials: k.materials,
    parts: k.parts,
    textures: materials.textures,
    setHood: shell.setHood,
    setTrunk: shell.setTrunk,
  };
}
