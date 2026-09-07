import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  cylinderPose,
  valveLift,
  strokeAt,
  advanceCycle,
  assemblyOffset,
  stagedSeparation,
  flowGate,
  frameDeltaSeconds,
  CRANK_RADIUS,
  ROD_LENGTH,
} from '../lib/engine/mechanics.ts';
import { PARTS } from '../lib/engine/catalog.ts';
import {
  sampleTour,
  tourShots,
  tourDuration,
  exportSrt,
  exportScript,
  tourCaptions,
} from '../lib/engine/tour.ts';

test('all rods maintain length and piston travel over two revolutions', () => {
  for (let n = 0; n < 4; n++)
    for (let angle = 0; angle <= 720; angle++) {
      const p = cylinderPose(angle, n);
      assert.ok(
        Math.abs(Math.hypot(p.crankX, p.pinY - p.crankY) - ROD_LENGTH) < 1e-10,
      );
      assert.ok(p.pinY >= ROD_LENGTH - CRANK_RADIUS - 1e-10);
      assert.ok(p.pinY <= ROD_LENGTH + CRANK_RADIUS + 1e-10);
      assert.ok(Math.abs(Math.sin(p.rodAngle) * ROD_LENGTH - p.crankX) < 1e-10);
    }
});
test('physical crank pairing and four-stroke phases match 1–3–4–2', () => {
  for (let angle = 0; angle < 720; angle += 3) {
    assert.ok(
      Math.abs(cylinderPose(angle, 0).pinY - cylinderPose(angle, 3).pinY) <
        1e-10,
    );
    assert.ok(
      Math.abs(cylinderPose(angle, 1).pinY - cylinderPose(angle, 2).pinY) <
        1e-10,
    );
  }
  [0, 2, 3, 1].forEach((cylinder, index) =>
    assert.equal(cylinderPose(index * 180, cylinder).phase, 0),
  );
  assert.deepEqual(
    [0, 180, 360, 540].map((x) => strokeAt(x)),
    ['Power', 'Exhaust', 'Intake', 'Compression'],
  );
});
test('cycle seeking is periodic and returns identical poses', () => {
  for (let n = 0; n < 4; n++)
    for (const x of [0, 1, 113.5, 179, 359.5, 539, 719.5])
      assert.deepEqual(cylinderPose(x, n), cylinderPose(x + 720, n));
});
test('valves remain closed outside their declared idealized strokes', () => {
  for (let angle = 0; angle < 720; angle++) {
    const intake = valveLift(angle, 'intake'),
      exhaust = valveLift(angle, 'exhaust');
    assert.ok(intake >= 0 && intake <= 0.22 && exhaust >= 0 && exhaust <= 0.22);
    assert.ok(!(intake > 0 && exhaust > 0));
    if (angle <= 360 || angle >= 540) assert.equal(intake, 0);
    if (angle <= 180 || angle >= 360) assert.equal(exhaust, 0);
  }
});
test('idealized inlet/exhaust disks remain above the moving piston crown', () => {
  for (let angle = 0; angle < 720; angle++)
    for (let n = 0; n < 4; n++) {
      const p = cylinderPose(angle, n);
      const crown = p.pinY + 0.3105;
      for (const type of ['intake', 'exhaust'])
        assert.ok(2.51 - valveLift(p.phase, type) - 0.0175 > crown);
    }
});
test('clock advance is time-step independent and wraps safely', () => {
  const direct = advanceCycle(713, 1, 0.32);
  let stepped = 713;
  for (let i = 0; i < 100; i++) stepped = advanceCycle(stepped, 0.01, 0.32);
  assert.ok(Math.abs(direct - stepped) < 1e-8);
  assert.equal(advanceCycle(10, -1, 0.32), 10);
});

test('an older first RAF timestamp cannot rewind flow clocks or produce negative curve samples', () => {
  let clock = 0,
    previous = 1012;
  for (const now of [1000, 1016, 1032, 8000]) {
    const dt = frameDeltaSeconds(now, previous);
    assert.ok(dt >= 0 && dt <= 0.06);
    clock += dt;
    for (let i = 0; i < 12; i++) assert.ok((i / 12 + clock * 0.2) % 1 >= 0);
    previous = now;
  }
  assert.equal(frameDeltaSeconds(1000, 1012), 0);
  assert.equal(frameDeltaSeconds(2000, 1000), 0.06);
});
test('assembly transforms clamp and restore without accumulated error', () => {
  assert.deepEqual(assemblyOffset([2, 3, -4], 0), [0, 0, -0]);
  assert.deepEqual(assemblyOffset([2, 3, -4], 1), [2, 3, -4]);
  assert.deepEqual(assemblyOffset([2, 3, -4], 2), [2, 3, -4]);
  assert.deepEqual(assemblyOffset([2, 3, -4], -1), [0, 0, -0]);
});
test('each named part has a unique ID, description and system', () => {
  assert.equal(new Set(PARTS.map((p) => p.id)).size, PARTS.length);
  for (const p of PARTS) {
    assert.ok(p.name && p.description && p.material && p.system && p.assembly);
  }
  assert.equal(PARTS.length, 86);
});

test('staged disassembly exposes covers first and exactly restores every assembly', () => {
  for (const p of PARTS) {
    assert.equal(stagedSeparation(p.id, 0), 0);
    assert.equal(stagedSeparation(p.id, 1), 1);
    let prior = 0;
    for (let i = 0; i <= 100; i++) {
      const value = stagedSeparation(p.id, i / 100);
      assert.ok(value >= prior && value <= 1);
      prior = value;
    }
  }
  assert.ok(stagedSeparation('cover', 0.25) > stagedSeparation('crank', 0.25));
});
test('flow arrows respect inlet and exhaust valve events', () => {
  for (let angle = 0; angle < 720; angle++) {
    assert.equal(flowGate('air', angle), valveLift(angle, 'intake') > 0);
    assert.equal(flowGate('fuel', angle), valveLift(angle, 'intake') > 0);
    assert.equal(flowGate('exhaust', angle), valveLift(angle, 'exhaust') > 0);
  }
});
test('both tours have continuous shot boundaries and an explicit interactive ending', () => {
  for (const variant of ['full', 'teaser']) {
    let t = 0;
    for (const shot of tourShots(variant)) {
      assert.equal(sampleTour(t, variant).shot.id, shot.id);
      assert.equal(sampleTour(t, variant).u, 0);
      t += shot.duration;
    }
    assert.equal(t, tourDuration(variant));
    assert.equal(sampleTour(t, variant).done, true);
    assert.equal(sampleTour(t, variant).shot.view, 'invite');
    assert.ok(exportScript(variant).includes('throttle'));
    const srt = exportSrt(variant);
    assert.ok(srt.startsWith('1\n00:00:00,000'));
    assert.ok(!srt.includes('NaN'));
  }
  assert.ok(tourDuration('teaser') < tourDuration('full'));
});

test('direct injection is confined to the illustrative intake/compression window', () => {
  for (let phase = 0; phase < 720; phase++) {
    assert.equal(flowGate('direct-fuel', phase), phase > 410 && phase < 665);
    assert.equal(
      flowGate('direct-fuel', phase + 720),
      flowGate('direct-fuel', phase),
    );
    if (phase < 360) assert.equal(flowGate('direct-fuel', phase), false);
  }
  assert.equal(flowGate('fuel', 600), false);
  assert.equal(flowGate('direct-fuel', 600), true);
});

test('camera paths stay continuous at editorial cuts and focus closer for details', () => {
  for (const variant of ['full', 'teaser']) {
    let t = 0;
    for (const shot of tourShots(variant)) {
      if (t > 0) {
        const a = sampleTour(t - 0.00001, variant).camera,
          b = sampleTour(t, variant).camera;
        for (const key of ['distance', 'yaw', 'elevation'])
          assert.ok(Math.abs(a[key] - b[key]) < 0.001);
        a.target.forEach((x, i) =>
          assert.ok(Math.abs(x - b.target[i]) < 0.001),
        );
      }
      assert.ok(shot.camera[1].distance <= shot.camera[0].distance);
      t += shot.duration;
    }
    for (let time = 0; time <= t; time += 0.2) {
      const s = sampleTour(time, variant);
      assert.ok(
        [
          ...s.camera.target,
          s.camera.distance,
          s.camera.yaw,
          s.camera.elevation,
          s.cycle,
        ].every(Number.isFinite),
      );
      assert.ok(s.explode >= 0 && s.explode <= 1);
    }
  }
});

test('captions cover the complete tour without gaps, overflow or missing words', () => {
  for (const variant of ['full', 'teaser']) {
    const cues = tourCaptions(variant);
    let end = 0;
    for (const cue of cues) {
      assert.ok(Math.abs(cue.start - end) < 0.00001);
      assert.ok(cue.end > cue.start);
      assert.ok(cue.text.split(/\s+/).length <= 10);
      end = cue.end;
    }
    assert.ok(Math.abs(end - tourDuration(variant)) < 0.00001);
    assert.equal(
      cues.map((c) => c.text).join(' '),
      tourShots(variant)
        .map((s) => s.narration)
        .join(' '),
    );
  }
});
