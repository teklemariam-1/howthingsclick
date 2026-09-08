import assert from 'node:assert/strict';
import * as T from 'three';
import {
  steeringExperimentAt,
  roadWheelAngle,
} from '../lib/self-driving/steering';
import { cybercabDoorRotation } from '../components/self-driving/door-motion';
import { createCybercab } from '../components/self-driving/geometry';
import { motorDriverAt } from '../lib/self-driving/motor-driver';
for (const amplitude of [5, 18, 25]) {
  const settled = steeringExperimentAt(7, amplitude);
  assert(
    Math.abs(settled.error) < 0.0001,
    'controller settles onto target angle',
  );
  const before = steeringExperimentAt(12.49, amplitude),
    hit = steeringExperimentAt(12.5, amplitude),
    after = steeringExperimentAt(16, amplitude);
  assert(
    Math.abs(hit.error) > Math.abs(before.error) + 0.09,
    'disturbance creates measurable angle error',
  );
  assert(Math.abs(after.error) < 0.001, 'feedback recovers after disturbance');
  assert(hit.effort > 0, 'motor command opposes negative disturbance');
  assert(
    Math.abs(steeringExperimentAt(24, amplitude).measured) < 0.0001,
    'wheels center at end',
  );
}
assert(
  roadWheelAngle(0.3, 1) > roadWheelAngle(0.3, -1),
  'inner wheel turns more sharply',
);
assert.equal(roadWheelAngle(0, 1), 0);
assert(Math.abs(roadWheelAngle(-0.3, -1) + roadWheelAngle(0.3, 1)) < 1e-10);
for (const side of [-1, 1]) {
  const pivot = new T.Vector3(0.75, 1.01, side * 0.84);
  const trailing = new T.Vector3(-1.7, -0.1, 0);
  let previousHeight = 0;
  for (let i = 0; i <= 20; i++) {
    const q = cybercabDoorRotation(side, i / 20),
      p = trailing.clone().applyQuaternion(q).add(pivot);
    assert(
      p.y >= previousHeight,
      'door trailing edge rises throughout opening',
    );
    assert(side * p.z >= 0.84 - 1e-8, 'door leaf swings outward');
    previousHeight = p.y;
    assert(Math.abs(q.length() - 1) < 1e-10);
  }
  assert(previousHeight > 2.4, 'open leaf is upright above the roof');
  assert(
    cybercabDoorRotation(side, 0).equals(new T.Quaternion()),
    'closed door transform is exact',
  );
}
for (const effort of [-1, -0.3, 0, 0.3, 1]) {
  for (let i = 0; i < 900; i++) {
    const d = motorDriverAt(i / 37, effort);
    for (const phase of d.phases) {
      assert(
        !(phase.high && phase.low),
        'no simultaneous high/low switch in a leg',
      );
      assert(phase.duty >= 0.08 - 1e-9 && phase.duty <= 0.92 + 1e-9);
    }
    assert(
      Math.abs(d.phases.reduce((sum, p) => sum + p.current, 0)) < 1e-9,
      'balanced normalized phase currents',
    );
  }
}
const forward = motorDriverAt(1.2, 0.8),
  reverse = motorDriverAt(1.2, -0.8);
assert(
  Math.abs(forward.phases[0].current + reverse.phases[0].current) < 1e-9,
  'opposite motor effort reverses phase-current signs',
);
const car = createCybercab();
car.update(0, 0.3, 0);
car.group.updateMatrixWorld(true);
const inner = car.group.getObjectByName('front_wheel_pivot_1')!;
assert(Math.abs(inner.rotation.y + roadWheelAngle(0.3, 1)) < 1e-10);
car.update(0, 0, 1);
car.update(0, 0, 0);
assert.equal(Math.abs(inner.rotation.y), 0);
console.log(
  'Mechanism checks passed: feedback recovery, steering linkage angles, outward/upward door sweep and exact closure.',
);
