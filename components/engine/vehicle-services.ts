import * as THREE from 'three';
import {
  createVehicleAssemblyController,
  type VehicleAssembly,
} from './vehicle-assemblies';
import type { VehiclePart } from '../../lib/engine/vehicle-parts';

const definitions: { source: string; part: VehiclePart }[] = [
  {
    source: 'radiator',
    part: {
      id: 'car-radiator',
      name: 'Radiator and electric cooling fan',
      system: 'climate',
      offset: [-9, 3, 0],
      stage: 2,
      material: 'Aluminium core, polymer tanks and fan',
      description:
        'The front-mounted radiator transfers coolant heat to outside air. Its electric fan draws air through the fins when road airflow is insufficient.',
    },
  },
  {
    source: 'coolant-hoses',
    part: {
      id: 'car-coolant-hoses',
      name: 'Radiator and bypass hoses',
      system: 'climate',
      offset: [-6, 5, -4],
      stage: 1,
      material: 'Reinforced rubber',
      description:
        'Upper and lower hoses connect the engine to the radiator. The bypass path allows coolant circulation while the thermostat is closed.',
    },
  },
  {
    source: 'expansion-tank',
    part: {
      id: 'car-expansion-tank',
      name: 'Coolant expansion reservoir',
      system: 'climate',
      offset: [-5, 5, 6],
      stage: 1,
      material: 'Translucent polymer and rubber',
      description:
        'The reservoir accommodates coolant expansion and contraction. It stays in the engine bay when the engine is removed.',
    },
  },
  {
    source: 'airbox',
    part: {
      id: 'car-air-cleaner',
      name: 'Air cleaner and inlet duct',
      system: 'fuel',
      offset: [-4, 5, -7],
      stage: 1,
      material: 'Moulded polymer, filter media and rubber',
      description:
        'The air cleaner traps particles before air reaches the throttle. The housing and inlet duct can be removed separately from the engine.',
    },
  },
];

// Reuse the engine lab's geometry without sharing its selection, materials or
// assembly transforms. Only one representation is shown in each exhibit mode.
export function createVehicleServices(
  sources: Map<string, { group: THREE.Group }>,
) {
  const group = new THREE.Group();
  group.name = 'vehicle-service-assemblies';
  const entries: VehicleAssembly[] = definitions.map(({ source, part }) => {
    const original = sources.get(source);
    if (!original) throw new Error(`Missing engine-bay source: ${source}`);
    const copy = original.group.clone(true);
    copy.name = part.id;
    copy.userData.vehiclePartId = part.id;
    group.add(copy);
    return { part, group: copy };
  });
  const controller = createVehicleAssemblyController(group, entries);
  return {
    group,
    controller,
    sourceIds: new Set(definitions.map((d) => d.source)),
  };
}
