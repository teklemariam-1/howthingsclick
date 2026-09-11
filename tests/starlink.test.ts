import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  durationFor,
  shotsFor,
  sampleTour,
  arrayGain,
  phaseDelay,
  orbitalSpeed,
  orbitalPeriod,
  propagationMs,
  type Format,
} from '../lib/starlink/simulation';
assert.equal(durationFor('short'), 60);
assert.equal(durationFor('full'), 150);
for (const f of ['full', 'short'] as Format[]) {
  const shots = shotsFor(f);
  let start = 0;
  for (const s of shots) {
    assert.equal(sampleTour(start + 0.01, f).shot.id, s.id);
    start += s.duration;
  }
  for (let t = 0; t <= durationFor(f); t += 0.1) {
    const v = sampleTour(t, f);
    assert.ok(Number.isFinite(v.angle));
    assert.ok(v.explode >= 0 && v.explode <= 1);
    assert.ok(v.progress >= 0 && v.progress <= 1);
  }
  assert.equal(sampleTour(durationFor(f), f).shot.id, 'explore');
  assert.deepEqual(sampleTour(26, f), sampleTour(26, f));
}
for (const steer of [-45, -20, 0, 20, 45]) {
  assert.ok(Math.abs(arrayGain(steer, steer) - 1) < 1e-9);
  assert.ok(arrayGain(steer + 8, steer) < 0.9);
  assert.ok(Math.abs(phaseDelay(3, steer) + phaseDelay(3, -steer)) < 1e-10);
}
assert.ok(orbitalSpeed() > 7.5 && orbitalSpeed() < 7.7);
assert.ok(orbitalPeriod() / 60 > 93 && orbitalPeriod() / 60 < 96);
assert.ok(propagationMs(480) > 1.5 && propagationMs(480) < 1.7);
assert.ok(propagationMs(35786) > propagationMs(480) * 70);
// No illustrated link may pass through Earth in any routing mode or handoff phase.
function point(a: number, r: number) {
  const v = [Math.sin(a), Math.sin(a) * 0.22, Math.cos(a)];
  const n = Math.hypot(...v);
  return v.map((x) => (x * r) / n);
}
function closest(a: number[], b: number[]) {
  const d = b.map((x, i) => x - a[i]);
  const f = Math.min(
    1,
    Math.max(
      0,
      -a.reduce((s, x, i) => s + x * d[i], 0) /
        d.reduce((s, x) => s + x * x, 0),
    ),
  );
  return Math.hypot(...a.map((x, i) => x + f * d[i]));
}
for (let t = 0; t < 160; t += 0.3) {
  const drift = Math.sin(t * 0.16) * 0.06;
  const [a, b, c] = [0.33, -0.14, -0.6].map((x) => point(x + drift, 5.377)),
    home = point(0.12, 5.02);
  for (const laser of [false, true]) {
    const ground = point(laser ? -0.62 : 0.18, 5.02);
    for (const [x, y] of [
      [home, a],
      [home, b],
      [a, b],
      [b, c],
      [laser ? c : a, ground],
    ])
      assert.ok(closest(x, y) > 5, 'A link crosses the planet');
  }
}
const data = readFileSync('public/models/starlink-hardware.glb');
assert.equal(data.toString('utf8', 0, 4), 'glTF');
const gltf = JSON.parse(data.toString('utf8', 20, 20 + data.readUInt32LE(12)));
const names = gltf.nodes.map((n: { name: string }) => n.name);
for (const name of [
  'satellite_bus',
  'satellite_antennas',
  'satellite_avionics',
  'satellite_thermal',
  'satellite_lasers',
  'satellite_wing_left',
  'satellite_wing_right',
  'terminal_radome',
  'terminal_back',
  'terminal_array',
  'terminal_board',
  'terminal_stand',
  'router',
])
  assert.ok(names.includes(name), 'Missing ' + name);
const left = gltf.nodes.find(
    (n: { name: string }) => n.name === 'satellite_wing_left',
  ),
  right = gltf.nodes.find(
    (n: { name: string }) => n.name === 'satellite_wing_right',
  );
assert.notEqual(
  left.mesh,
  right.mesh,
  'Opposing wings must retain independent geometry',
);
for (const a of gltf.accessors) {
  if (a.min) assert.ok(a.min.every(Number.isFinite));
  if (a.max) assert.ok(a.max.every(Number.isFinite));
}
for (const [node, sign] of [
  [left, -1],
  [right, 1],
] as const) {
  const mesh = gltf.meshes[node.mesh];
  for (const p of mesh.primitives) {
    const a = gltf.accessors[p.attributes.POSITION];
    assert.ok(
      sign < 0 ? a.max[0] < -1.8 : a.min[0] > 1.8,
      'Solar wing is on the wrong side',
    );
  }
}
console.log(
  'Starlink: tour timing, phase steering, orbit/propagation, line of sight and 14 hardware assemblies passed.',
);
