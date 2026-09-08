import assert from 'node:assert/strict';
import { TOUR, TOUR_DURATION, tourAt } from '../lib/self-driving/tour';
import { PlaybackClock } from '../lib/self-driving/playback';

const clock = new PlaybackClock();
clock.tour = true;
clock.setPlaying(true, 1000);
clock.advance(2000, 240, true);
assert.equal(
  clock.time,
  1,
  'a long render frame must not slow the narration timeline',
);
clock.setPlaying(false, 2000);
clock.advance(9000, 240, true);
assert.equal(clock.time, 1, 'paused time must be excluded');
clock.setPlaying(true, 9000);
clock.advance(9500, 240, true);
assert.equal(clock.time, 1.5);
clock.setPlaying(false, 9500);
clock.advance(999500, 240, false);
clock.setPlaying(true, 999500);
clock.advance(1000000, 240, true);
assert.equal(clock.time, 2, 'returning from a hidden tab must not jump ahead');
clock.seek(239.8, 1000000, 240);
clock.advance(1001000, 240, true);
assert.equal(clock.time, 240);
clock.seek(-9, 1002000, 240);
assert.equal(clock.time, 0);
clock.tour = false;
clock.rate = 2;
clock.advance(1002500, 24, true);
assert.equal(clock.time, 1, 'exploration speed remains adjustable');

for (const s of TOUR) {
  const duration = s.end - s.at;
  assert(s.voiceAt >= 0 && s.voiceEnd <= duration && s.voiceEnd > s.voiceAt);
  assert(s.narration.trim().length > 30);
  assert(
    (s.narration.split(/\s+/).length / (s.voiceEnd - s.voiceAt)) * 60 < 150,
    'readable narration pace',
  );
  assert.equal(s.motion[0].at, 0);
  assert.equal(s.motion.at(-1)!.at, duration);
  for (let i = 1; i < s.motion.length; i++)
    assert(s.motion[i].at > s.motion[i - 1].at);
  for (let t = s.at; t < s.end; t += 0.25) {
    const a = tourAt(t);
    tourAt(230);
    tourAt(0);
    assert.deepEqual(
      tourAt(t),
      a,
      'seeking from any chapter reproduces the same shot',
    );
    for (const n of [
      ...a.pose.target,
      a.pose.distance,
      a.pose.yaw,
      a.pose.elevation,
      a.pose.fov,
    ])
      assert(Number.isFinite(n));
    for (const n of [a.pose.reveal, a.pose.explode, a.pose.doors])
      assert(n >= 0 && n <= 1);
    assert(a.pose.distance > 0 && a.pose.fov >= 30 && a.pose.fov <= 75);
  }
}
assert.equal(tourAt(0).assembly, 'assembled');
assert(tourAt(20).pose.doors > 0.99, 'cabin shot opens the doors');
assert(tourAt(34).pose.explode > 0.99, 'the body disassembly must be visible');
assert(tourAt(80).pose.distance < 2, 'computer gets a true close-up');
assert.equal(
  tourAt(TOUR_DURATION).pose.explode,
  0,
  'ending reassembles the car',
);
assert.equal(tourAt(TOUR_DURATION).assembly, 'assembled');
assert.equal(tourAt(Number.NaN).index, 0);
console.log(
  'Tour checks passed: narration windows, deterministic camera/assembly, playback pauses, low-FPS clock, final reassembly.',
);
