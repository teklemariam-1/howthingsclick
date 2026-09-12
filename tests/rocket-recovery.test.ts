import assert from 'node:assert/strict';
import { legFootPosition, legGeometry } from '../lib/rocket-recovery/geometry';
import {
  simulate,
  sampleFlight,
  sampleShort,
  defaultSettings,
  SHORT_DURATION,
  shortShots,
  specs,
} from '../lib/rocket-recovery/simulation';
for (const vehicle of ['falcon9', 'superheavy'] as const) {
  const automatic = simulate({ ...defaultSettings, vehicle });
  assert.equal(
    automatic.outcome,
    vehicle === 'falcon9' ? 'landed' : 'caught',
    JSON.stringify(automatic),
  );
  assert.ok(automatic.impactSpeed < 3);
  assert.ok(automatic.ignition > 140 && automatic.ignition < 230);
  assert.ok(
    automatic.frames.every(
      (f, i) =>
        Number.isFinite(f.altitude) &&
        f.altitude >= 0 &&
        f.fuel >= 0 &&
        f.fuel <= 1 &&
        f.throttle >= 0 &&
        f.throttle <= 1 &&
        (i === 0 || f.t > automatic.frames[i - 1].t),
    ),
  );
  assert.equal(sampleFlight(automatic, -1).altitude, 260);
  assert.equal(sampleFlight(automatic, automatic.duration + 10).altitude, 0);
  const late = simulate({
    ...defaultSettings,
    vehicle,
    automatic: false,
    ignitionHeight: 25,
  });
  assert.ok(late.outcome === 'hard-contact' || late.outcome === 'missed');
  assert.ok(late.impactSpeed > automatic.impactSpeed + 20);
  const noGuidance = simulate({
    ...defaultSettings,
    vehicle,
    wind: 18,
    guidance: false,
  });
  assert.equal(noGuidance.outcome, 'missed');
  for (const wind of [-12, 0, 12]) {
    const flight = simulate({ ...defaultSettings, vehicle, wind });
    assert.equal(flight.outcome, vehicle === 'falcon9' ? 'landed' : 'caught');
    for (let t = 0; t < flight.duration; t += 0.02) {
      const f = sampleFlight(flight, t);
      assert.ok(
        Object.values(f).every(
          (v) => typeof v !== 'number' || Number.isFinite(v),
        ),
      );
    }
  }
  assert.deepEqual(
    simulate({ ...defaultSettings, vehicle }),
    automatic,
    'Deterministic replay must be identical',
  );
  assert.ok(specs[vehicle].bodyHeight / specs[vehicle].radius > 14);
}
let cursor = 0;
for (const shot of shortShots) {
  assert.equal(shot.start, cursor);
  assert.equal(sampleShort(shot.start).shot.id, shot.id);
  cursor = shot.end;
}
assert.equal(cursor, SHORT_DURATION);
assert.equal(sampleShort(60).shot.id, 'explore');
console.log(
  'Rocket recovery: auto landing/catch, late ignition, wind rejection, missed target, contact interpolation, deterministic replay and 60-second tour passed.',
);

const feet = [0, 1, 2, 3].map((i) => legFootPosition(i));
for (const f of feet) {
  assert.ok(
    Math.abs(f.y - legGeometry.footHeight / 2 - legGeometry.deckHeight) < 1e-8,
    'Foot pad meets deck',
  );
  assert.ok(Math.hypot(f.x, f.z) > 8, 'Adequate radial stance');
}
for (let i = 0; i < 4; i++) {
  const a = feet[i],
    b = feet[(i + 1) % 4];
  assert.ok(
    Math.abs(a.x * b.x + a.z * b.z) < 1e-8,
    'Adjacent legs are perpendicular',
  );
  const opposite = feet[(i + 2) % 4];
  assert.ok(
    Math.hypot(a.x + opposite.x, a.z + opposite.z) < 1e-8,
    'Opposite feet balance about centre',
  );
}
console.log(
  'Four radial legs, balanced stance and deck-contact height passed.',
);

for (let step = 0; step <= 100; step++) {
  const points = [0, 1, 2, 3].map((i) => legFootPosition(i, step / 100));
  for (const p of points)
    assert.ok(
      Math.hypot(p.x, p.z) > specs.falcon9.radius,
      'Foot must stay outside barrel through the full deployment arc',
    );
  for (let i = 0; i < 4; i++)
    for (let j = i + 1; j < 4; j++)
      assert.ok(
        Math.hypot(
          points[i].x - points[j].x,
          points[i].y - points[j].y,
          points[i].z - points[j].z,
        ) > 2.5,
        'Landing feet must never cross each other',
      );
}
console.log(
  'All 101 deployment poses keep every leg outside the barrel and separated.',
);
