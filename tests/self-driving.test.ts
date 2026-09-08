import assert from 'node:assert/strict';
import * as T from 'three';
import {
  simulate,
  DEFAULT_SETTINGS,
  DURATION,
  frameAt,
  blockedByVan,
  pedestrianVisible,
  laneAt,
  SCENARIOS,
} from '../lib/self-driving/simulation';
import { TOUR, TOUR_DURATION, tourAt } from '../lib/self-driving/tour';
import { createCybercab } from '../components/self-driving/geometry';
assert(
  blockedByVan(-6, 1.7, 5, -5.7),
  'van must block a line through its footprint',
);
assert(!blockedByVan(-6, 1.7, 5, 1.7), 'van must not block the lane');
assert(!pedestrianVisible(-10, 1.7, -5.7), 'hidden pedestrian is not detected');
assert(
  pedestrianVisible(-5, 1.7, 0),
  'visible crossing pedestrian is detected',
);
let cases = 0;
for (const scenario of SCENARIOS)
  for (const speedKph of [10, 22, 35])
    for (const delay of [1, 3, 8]) {
      const settings = {
        ...DEFAULT_SETTINGS,
        scenario: scenario.id,
        speedKph,
        pedestrianDelay: delay,
        greenAt: delay === 1 ? 6 : delay === 8 ? 18 : 11,
      };
      const frames = simulate(settings);
      assert.equal(frames.length, 1441);
      assert.equal(frames.at(-1)!.time, DURATION);
      for (let i = 0; i < frames.length; i++) {
        const f = frames[i];
        for (const value of [f.x, f.z, f.speed, f.acceleration, f.pedestrianZ])
          assert(Number.isFinite(value));
        assert(f.speed >= 0);
        if (i) assert(f.x >= frames[i - 1].x, 'car must never move backwards');
        if (scenario.id === 'signal' && f.signal === 'red')
          assert(f.x <= -0.2 + 1e-9, 'red-light stop boundary');
        if (scenario.id === 'crossing' && Math.abs(f.pedestrianZ - f.z) < 1.12)
          assert(
            Math.abs(5 - f.x) > 2.45,
            'car must not overlap a crossing pedestrian',
          );
        if (scenario.id === 'roadworks' && f.x > -1 && f.x < 8)
          assert(f.z < -0.8, 'car must clear the cones');
      }
      assert.deepEqual(
        frameAt(frames, 7.35),
        frameAt(simulate(settings), 7.35),
        'rewind must reproduce state',
      );
      assert.equal(frameAt(frames, -4).time, 0);
      assert.equal(frameAt(frames, 90).time, DURATION);
      if (scenario.id === 'signal')
        assert(frames.at(-1)!.x > 0, 'car proceeds after green');
      cases++;
    }
assert.equal(laneAt(-15, 'roadworks'), 1.7);
assert.equal(laneAt(2, 'roadworks'), -1.7);
assert.equal(laneAt(20, 'roadworks'), 1.7);
assert.equal(TOUR[0].at, 0);
assert.equal(TOUR.at(-1)!.end, TOUR_DURATION);
for (let i = 0; i < TOUR.length; i++) {
  if (i) assert.equal(TOUR[i - 1].end, TOUR[i].at);
  assert(TOUR[i].end > TOUR[i].at);
  assert(tourAt(TOUR[i].at).step === TOUR[i]);
}
const car = createCybercab();
let meshes = 0;
car.group.traverse((o) => {
  if (o instanceof T.Mesh) {
    meshes++;
    const position = o.geometry.getAttribute('position');
    assert(position.count > 0);
    for (const value of position.array)
      assert(Number.isFinite(value), 'finite model coordinates');
  }
});
assert(meshes > 50);
car.group.updateMatrixWorld(true);
const closed = new T.Box3().setFromObject(car.group),
  size = closed.getSize(new T.Vector3());
assert(size.x > 4 && size.x < 4.7);
assert(size.z > 1.7 && size.z < 1.95);
assert(size.y > 1.35 && size.y < 1.6);
car.update(3, 0.2, 1);
car.group.updateMatrixWorld(true);
const opened = new T.Box3().setFromObject(car.group);
assert(opened.max.y > closed.max.y + 0.2, 'doors move up');
car.update(0, 0, 0);
car.group.updateMatrixWorld(true);
assert(
  new T.Box3().setFromObject(car.group).equals(closed),
  'doors reassemble exactly',
);
console.log(
  JSON.stringify(
    {
      scenarioCases: cases,
      modelMeshes: meshes,
      closedSize: size.toArray(),
      tourSeconds: TOUR_DURATION,
      checks:
        'occlusion, collision clearance, red-light stops, restart determinism, route clearance, door assembly',
    },
    null,
    2,
  ),
);
