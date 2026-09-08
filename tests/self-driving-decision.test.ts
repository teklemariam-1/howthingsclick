import assert from 'node:assert/strict';
import {
  DEFAULT_SETTINGS,
  simulate,
  frameAt,
} from '../lib/self-driving/simulation';
import {
  decisionCheckpoints,
  decisionLayout,
  decisionReadout,
  observationCell,
} from '../lib/self-driving/decision';
import { TOUR, tourAt } from '../lib/self-driving/tour';

let cases = 0;
for (const scenario of ['crossing', 'signal', 'roadworks'] as const) {
  for (const speedKph of [10, 22, 35])
    for (const timing of [1, 4, 8]) {
      const settings = {
        ...DEFAULT_SETTINGS,
        scenario,
        speedKph,
        pedestrianDelay: timing,
        greenAt: 6 + timing,
      };
      const frames = simulate(settings),
        points = decisionCheckpoints(frames, settings);
      assert.ok(points.length >= 3);
      assert.equal(new Set(points.map((p) => p.id)).size, points.length);
      let last = -1;
      for (const p of points) {
        assert.ok(p.time >= last && p.time <= 24);
        last = p.time;
        const f = frameAt(frames, p.time);
        if (p.id === 'hidden') {
          assert.equal(f.visible, false);
          assert.equal(decisionReadout(f, settings).prediction.length, 0);
        }
        if (p.id === 'detected') assert.equal(f.visible, true);
        if (p.id === 'braking') assert.ok(f.acceleration < -0.3);
        if (p.id === 'stopped') assert.ok(f.speed < 0.001);
        if (p.id === 'clear') assert.ok(f.pedestrianZ >= 4.2);
        if (p.id === 'green') assert.equal(f.signal, 'green');
      }
      for (const f of frames.filter((_, i) => i % 60 === 0)) {
        const d = decisionReadout(f, settings);
        assert.ok(Number.isFinite(d.angle) && Number.isFinite(d.speed));
        if (!f.visible) assert.equal(d.prediction.length, 0);
      }
      cases++;
    }
}
const early = { ...DEFAULT_SETTINGS, pedestrianDelay: 1 },
  late = { ...DEFAULT_SETTINGS, pedestrianDelay: 8 };
const checkpoint = (s: typeof early) =>
  decisionCheckpoints(simulate(s), s).find((p) => p.id === 'clear')!.time;
assert.ok(checkpoint(late) > checkpoint(early) + 6);
const first = simulate(DEFAULT_SETTINGS)[0];
assert.equal(observationCell(first, DEFAULT_SETTINGS, 5, -5.7), 'occluded');
assert.equal(observationCell(first, DEFAULT_SETTINGS, -20, 1.7), 'outside');
assert.equal(observationCell(first, DEFAULT_SETTINGS, -10, 1.7), 'visible');
for (const [w, h] of [
  [340, 760],
  [540, 760],
  [850, 550],
  [1920, 1080],
]) {
  const l = decisionLayout(w, h);
  assert.ok(l.road.w > 0 && l.road.h > 0 && l.panel.w > 0 && l.panel.h > 0);
  assert.equal(l.road.w * l.road.h + l.panel.w * l.panel.h, w * h);
  assert.ok(l.panel.x + l.panel.w <= w && l.panel.y + l.panel.h <= h);
}
for (const chapter of TOUR.filter(
  (c) => !c.engineering && (c.camera === 'follow' || c.camera === 'overhead'),
)) {
  assert.equal(chapter.view, 'linked');
  const sample = tourAt(chapter.at + 5);
  assert.equal(sample.view, 'linked');
  assert.equal(sample.engineering, false);
}
console.log(
  JSON.stringify({
    decisionScenarios: cases,
    checkpoints: 'event based',
    layouts: 'phone/tablet/desktop/1080p',
    tour: 'linked road chapters',
  }),
);
