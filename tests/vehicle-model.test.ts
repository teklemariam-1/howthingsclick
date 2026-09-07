import * as THREE from 'three';
import assert from 'node:assert/strict';
import { splitPanelRegion } from '../components/engine/panel-clipping';
import { trunkShutLine } from '../lib/engine/corolla-panel-lines';
import { createVehicleServices } from '../components/engine/vehicle-services';
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
// The lamp mounted on the lid must travel with it, while the quarter-panel
// lamp and deck shoulders remain on the body.
const innerLamp = c.byId.get('car-left-inner-tail-lamp')!.group;
const outerLamp = c.byId.get('car-left-tail-lamp')!.group;
const quarter = c.byId.get('car-left-quarter')!.group;
const innerStart = innerLamp.getWorldPosition(new THREE.Vector3());
const outerStart = outerLamp.getWorldPosition(new THREE.Vector3());
const quarterStart = quarter.getWorldPosition(new THREE.Vector3());
c.update({ ...initialVehicleAssembly, removed: ['car-trunk'] }, 1, true);
car.group.updateMatrixWorld(true);
assert(
  innerLamp.getWorldPosition(new THREE.Vector3()).distanceTo(innerStart) > 1,
);
assert(outerLamp.getWorldPosition(new THREE.Vector3()).equals(outerStart));
assert(quarter.getWorldPosition(new THREE.Vector3()).equals(quarterStart));
c.update(initialVehicleAssembly, 1, true);
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
// UV partitioning preserves the original area and its existing opening,
// including when the cut outline's winding is reversed.
const sheet = new THREE.Shape();
sheet.moveTo(-1, 0);
sheet.lineTo(1, 0);
sheet.lineTo(1, 1.1);
sheet.lineTo(-1, 1.1);
sheet.closePath();
const hole = new THREE.Path();
hole.absellipse(0, 0.76, 0.09, 0.035, 0, Math.PI * 2, false, 0);
sheet.holes.push(hole);
const source = new THREE.ShapeGeometry(sheet, 32);
const area = (geometry: THREE.BufferGeometry) => {
  const g = geometry.index ? geometry.toNonIndexed() : geometry,
    p = g.getAttribute('position');
  let total = 0;
  for (let i = 0; i < p.count; i += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(p, i),
      b = new THREE.Vector3().fromBufferAttribute(p, i + 1),
      c = new THREE.Vector3().fromBufferAttribute(p, i + 2);
    total += b.sub(a).cross(c.sub(a)).length() * 0.5;
  }
  if (g !== geometry) g.dispose();
  return total;
};
const boundary = trunkShutLine().getPoints(16);
const clipped = splitPanelRegion(source, boundary),
  reversed = splitPanelRegion(source, [...boundary].reverse());
assert(
  Math.abs(area(clipped.inside) + area(clipped.outside) - area(source)) < 1e-6,
);
assert(Math.abs(area(clipped.inside) - area(reversed.inside)) < 1e-6);
assert(area(clipped.inside) > 0.4 && area(clipped.outside) > 1);
for (const g of [
  source,
  clipped.inside,
  clipped.outside,
  reversed.inside,
  reversed.outside,
])
  g.dispose();
// Engine-lab parts keep their transforms/materials when the same geometry is
// selected, coloured or separated independently in the whole-car exhibit.
const sourceMaterial = new THREE.MeshStandardMaterial({ color: '#789abc' });
const originalServices = new Map(
  ['radiator', 'coolant-hoses', 'expansion-tank', 'airbox'].map((id, i) => {
    const group = new THREE.Group();
    group.position.set(i, 2, 3);
    group.scale.z = i === 3 ? -1 : 1;
    group.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), sourceMaterial));
    return [id, { group }];
  }),
);
const serviceModel = createVehicleServices(originalServices);
serviceModel.controller.update(
  {
    ...initialVehicleAssembly,
    removed: ['car-radiator'],
    selected: 'car-radiator',
    colors: true,
  },
  1,
  true,
);
assert.equal(originalServices.get('radiator')!.group.position.x, 0);
assert.equal(sourceMaterial.color.getHexString(), '789abc');
assert.notEqual(
  serviceModel.controller.byId.get('car-radiator')!.group.position.x,
  0,
);
assert.equal(
  serviceModel.controller.byId.get('car-air-cleaner')!.group.scale.z,
  -1,
);
serviceModel.controller.update(initialVehicleAssembly, 1, true);
assert(
  serviceModel.controller.byId
    .get('car-radiator')!
    .group.position.equals(originalServices.get('radiator')!.group.position),
);
serviceModel.controller.materials.forEach((m) => m.dispose());
originalServices.forEach(({ group }) =>
  group.traverse((o) => {
    if (o instanceof THREE.Mesh) o.geometry.dispose();
  }),
);
sourceMaterial.dispose();
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
