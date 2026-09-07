import * as THREE from 'three';
import assert from 'node:assert/strict';
import { splitPanelRegion } from '../components/engine/panel-clipping';
import { trunkShutLine } from '../lib/engine/corolla-panel-lines';
import { createVehicleServices } from '../components/engine/vehicle-services';
import { createVehicleContext } from '../components/engine/vehicle';
import { VEHICLE_UNITS_PER_METRE } from '../lib/engine/vehicle-dimensions';
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
// Published US LE track widths and brake diameters are physical dimensions,
// not just labels. Measure the actual assembled geometry in its local frame.
for (const [axle, inches, diameter] of [
  ['front', 60.3, 10.8],
  ['rear', 61.0, 10.2],
] as const) {
  const left = c.byId
    .get(`car-${axle}-left-tire`)!
    .group.getWorldPosition(new THREE.Vector3());
  const right = c.byId
    .get(`car-${axle}-right-tire`)!
    .group.getWorldPosition(new THREE.Vector3());
  assert(
    Math.abs(
      left.distanceTo(right) / VEHICLE_UNITS_PER_METRE - inches * 0.0254,
    ) < 1e-6,
    `${axle} track`,
  );
  const disc = c.byId.get(`car-${axle}-left-disc`)!.group;
  const inverse = disc.matrixWorld.clone().invert();
  let radius = 0;
  disc.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const transform = inverse.clone().multiply(o.matrixWorld);
    const points = o.geometry.getAttribute('position');
    for (let i = 0; i < points.count; i++) {
      const p = new THREE.Vector3()
        .fromBufferAttribute(points, i)
        .applyMatrix4(transform);
      radius = Math.max(radius, Math.hypot(p.x, p.y));
    }
  });
  assert(
    Math.abs(radius * 2 - diameter * 0.0254) < 1e-5,
    `${axle} disc diameter`,
  );
}
// The door owns its upper painted surround, in addition to separately owned
// glass. A body-only upper ring would otherwise stay behind on disassembly.
for (const side of ['left', 'right'])
  for (const door of ['front', 'rear']) {
    const own = c.meshes.filter(
      (m) => m.userData.vehiclePartId === `car-${side}-${door}-door`,
    );
    assert(
      own.some((m) => {
        const p = m.geometry.getAttribute('position');
        for (let i = 0; i < p.count; i++) if (p.getY(i) > 1.34) return true;
        return false;
      }),
      `${side} ${door} upper surround belongs to door`,
    );
  }
const original = c.records.map((r) => r.group.matrixWorld.clone());
// Seat-mounted hardware follows its own backrest; the other backrest, bench
// cushion and fixed buckle anchors stay in place. This catches mirrored 60/40
// ownership and head restraints left floating after their seat is removed.
for (const [removed, moving, fixed] of [
  [
    'car-rear-seatback',
    [
      'car-rear-headrest-0',
      'car-rear-headrest-0.4',
      'car-rear-centre-armrest',
      'car-rear-armrest-cup-insert',
      'car-rear-belt-0',
    ],
    [
      'car-rear-seatback-left',
      'car-rear-headrest--0.4',
      'car-rear-seat',
      'car-rear-buckle-0',
    ],
  ],
  [
    'car-driver-seatback',
    ['car-driver-headrest'],
    ['car-driver-seat', 'car-passenger-headrest'],
  ],
] as const) {
  const ids = [...moving, ...fixed];
  const start = new Map(
    ids.map((id) => [id, c.byId.get(id)!.group.matrixWorld.clone()]),
  );
  c.update({ ...initialVehicleAssembly, removed: [removed] }, 1, true);
  car.group.updateMatrixWorld(true);
  for (const id of moving)
    assert(!c.byId.get(id)!.group.matrixWorld.equals(start.get(id)!), id);
  for (const id of fixed)
    assert(c.byId.get(id)!.group.matrixWorld.equals(start.get(id)!), id);
  c.update(initialVehicleAssembly, 1, true);
  car.group.updateMatrixWorld(true);
}
// The cover includes the side return up to the front wheel opening. It must
// travel with the cover instead of remaining as a detached fender fragment.
assert(
  c.meshes.some((m) => {
    if (m.userData.vehiclePartId !== 'car-front-bumper') return false;
    const p = m.geometry.getAttribute('position');
    for (let i = 0; i < p.count; i++)
      if (Math.abs(p.getX(i)) > 0.8 && p.getZ(i) > -0.25 && p.getZ(i) < -0.1)
        return true;
    return false;
  }),
  'front bumper owns its wheel-arch side return',
);
// Removing the foam must leave the structural reinforcement and its mounting
// stays in place. All five structural pieces can be removed independently.
const impactIds = [
  'car-front-impact-absorber',
  'car-front-crash-beam',
  'car-front-left-impact-stay',
  'car-front-right-impact-stay',
  'car-front-impact-fasteners',
];
const impactStart = new Map(
  impactIds.map((id) => [id, c.byId.get(id)!.group.matrixWorld.clone()]),
);
for (const removed of impactIds) {
  c.update({ ...initialVehicleAssembly, removed: [removed] }, 1, true);
  car.group.updateMatrixWorld(true);
  for (const id of impactIds)
    assert.equal(
      c.byId.get(id)!.group.matrixWorld.equals(impactStart.get(id)!),
      id !== removed,
      `${removed} independently separates from ${id}`,
    );
  c.update(initialVehicleAssembly, 1, true);
}
c.update({ ...initialVehicleAssembly, explode: 1 }, 1, true);
car.group.updateMatrixWorld(true);
assert(
  c.records.filter((r, i) => !r.group.matrixWorld.equals(original[i])).length >
    120,
);
c.update(initialVehicleAssembly, 1, true);
// Opening a closure rotates its attached hardware around its hinge, while the
// body-side mount, outer lamp and weatherstrip stay fixed. Closing restores it.
car.group.updateMatrixWorld(true);
const trunkMovingIds = [
  'car-trunk',
  'car-trunk-inner-frame',
  'car-trunk-latch',
  'car-left-trunk-hinge',
  'car-left-inner-tail-lamp',
];
const trunkFixedIds = [
  'car-left-trunk-hinge-bracket',
  'car-left-quarter',
  'car-left-tail-lamp',
  'car-trunk-seal',
  'car-trunk-striker',
];
const closureStart = new Map(
  [...trunkMovingIds, ...trunkFixedIds].map((id) => [
    id,
    c.byId.get(id)!.group.matrixWorld.clone(),
  ]),
);
car.setView('body', false, true);
car.update(10);
car.group.updateMatrixWorld(true);
for (const id of trunkMovingIds)
  assert(!c.byId.get(id)!.group.matrixWorld.equals(closureStart.get(id)!), id);
for (const id of trunkFixedIds)
  assert(c.byId.get(id)!.group.matrixWorld.equals(closureStart.get(id)!), id);
car.setView('body', false, false);
car.update(10);
car.group.updateMatrixWorld(true);
for (const [id, start] of closureStart)
  c.byId
    .get(id)!
    .group.matrixWorld.elements.forEach((v, i) =>
      assert(Math.abs(v - start.elements[i]) < 1e-9, id),
    );
const bumperChild = c.byId.get('car-left-rear-reflector')!.group;
const bumperChildStart = bumperChild.getWorldPosition(new THREE.Vector3());
c.update({ ...initialVehicleAssembly, removed: ['car-rear-bumper'] }, 1, true);
car.group.updateMatrixWorld(true);
assert(
  bumperChild
    .getWorldPosition(new THREE.Vector3())
    .distanceTo(bumperChildStart) > 1,
);
assert(
  c.byId
    .get('car-left-quarter')!
    .group.matrixWorld.equals(closureStart.get('car-left-quarter')!),
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
c.update(
  { ...initialVehicleAssembly, system: 'cabin', inspection: 'cabin' },
  1,
  true,
);
assert(
  c.meshes
    .filter((m) => m.userData.vehiclePartId === 'car-headliner')
    .every((m) => !m.visible),
);
assert(
  c.meshes
    .filter((m) => m.userData.vehiclePartId === 'car-right-front-door-trim')
    .some((m) => m.visible),
);
c.update(
  {
    ...initialVehicleAssembly,
    system: 'cabin',
    inspection: 'cabin',
    selected: 'car-headliner',
  },
  1,
  true,
);
assert(
  c.meshes
    .filter((m) => m.userData.vehiclePartId === 'car-headliner')
    .every((m) => m.visible),
);
c.update(initialVehicleAssembly, 1, true);
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
// A spatial Z/Y seam must conserve the same area even when UVs are unrelated.
const spatial = source.clone();
spatial.rotateY(Math.PI / 2);
const spatialResult = splitPanelRegion(
  spatial,
  boundary.map((p) => new THREE.Vector2(-p.x, p.y)),
  [2, 1],
);
assert(Math.abs(area(spatialResult.inside) - area(clipped.inside)) < 1e-6);
assert(
  Math.abs(
    area(spatialResult.inside) + area(spatialResult.outside) - area(spatial),
  ) < 1e-6,
);
assert.throws(() => splitPanelRegion(source, []), /at least three/);
spatial.dispose();
spatialResult.inside.dispose();
spatialResult.outside.dispose();
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
