import * as THREE from 'three';
import assert from 'node:assert/strict';
import { createVehicleContext } from '../components/engine/vehicle';
import {
  initialVehicleAssembly,
  vehicleStage,
} from '../lib/engine/vehicle-parts';
const car = createVehicleContext(),
  c = car.controller;
car.setView('body', false);
car.update(10);
assert(c.records.length > 120);
assert.equal(new Set(c.records.map((r) => r.part.id)).size, c.records.length);
const unassigned: string[] = [];
car.group.traverse((o) => {
  if (
    o instanceof THREE.Mesh &&
    !(o.material instanceof THREE.ShaderMaterial) &&
    !o.userData.vehiclePartId
  )
    unassigned.push(o.name);
});
assert.deepEqual(unassigned, []);
for (const r of c.records) {
  let count = 0;
  r.group.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      count++;
      const p = o.geometry.getAttribute('position');
      assert(p.count > 0, r.part.id);
      for (let i = 0; i < p.array.length; i++)
        assert(Number.isFinite(p.array[i]), r.part.id);
    }
  });
  assert(count > 0, r.part.id);
  assert(r.part.description.length > 25);
}
car.group.updateMatrixWorld(true);
const original = c.records.map((r) => r.group.matrixWorld.clone());
c.update({ ...initialVehicleAssembly, explode: 1 }, 1, true);
car.group.updateMatrixWorld(true);
assert(
  c.records.filter((r, i) => !r.group.matrixWorld.equals(original[i])).length >
    120,
);
c.update(initialVehicleAssembly, 1, true);
car.group.updateMatrixWorld(true);
c.records.forEach((r, i) =>
  assert(r.group.matrixWorld.equals(original[i]), r.part.id),
);
c.update(
  { ...initialVehicleAssembly, explode: 1, returned: ['car-left-fender'] },
  1,
  true,
);
assert.equal(c.byId.get('car-left-fender')!.amount, 0);
assert.equal(c.byId.get('car-right-fender')!.amount, 1);
c.update(
  {
    ...initialVehicleAssembly,
    removed: ['car-left-front-door'],
    selected: 'car-left-front-door',
    isolated: true,
  },
  1,
  true,
);
assert(c.byId.get('car-left-glass-1')!.group.visible);
assert(!c.byId.get('car-right-front-door')!.group.visible);
c.update(
  { ...initialVehicleAssembly, selected: 'car-left-glass-1', isolated: true },
  1,
  true,
);
assert(
  c.meshes
    .filter((m) => m.visible)
    .every((m) => m.userData.vehiclePartId === 'car-left-glass-1'),
);
c.update({ ...initialVehicleAssembly, system: 'cabin' }, 1, true);
assert(c.byId.get('car-driver-seat')!.group.visible);
assert(!c.byId.get('car-left-fender')!.group.visible);
assert.equal(vehicleStage(0, 0), 0);
assert.equal(vehicleStage(1, 6), 1);
assert(vehicleStage(0.3, 0) > vehicleStage(0.3, 5));
console.log(
  JSON.stringify({
    assemblies: c.records.length,
    meshes: c.meshes.length,
    unassigned,
    restored: true,
    nestedIsolation: true,
    finiteGeometry: true,
  }),
);
car.dispose();
