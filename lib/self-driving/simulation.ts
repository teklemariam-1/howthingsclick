export type Scenario = 'crossing' | 'signal' | 'roadworks';
export type View = 'linked' | 'street' | 'vision' | 'prediction' | 'planning';
export type CameraView = 'follow' | 'overhead' | 'bumper' | 'vehicle' | 'cabin';
export interface Settings {
  scenario: Scenario;
  speedKph: number;
  pedestrianDelay: number;
  greenAt: number;
}
export interface Frame {
  time: number;
  x: number;
  z: number;
  speed: number;
  acceleration: number;
  targetSpeed: number;
  pedestrianZ: number;
  visible: boolean;
  yielding: boolean;
  signal: 'red' | 'green';
  phase: string;
  reason: string;
  distance: number;
}
export const DURATION = 24;
export const STEP = 1 / 60;
export const DEFAULT_SETTINGS: Settings = {
  scenario: 'crossing',
  speedKph: 22,
  pedestrianDelay: 3,
  greenAt: 11,
};
export const SCENARIOS = [
  {
    id: 'crossing' as const,
    title: 'The hidden pedestrian',
    description:
      'A parked van blocks the view. Watch when the pedestrian becomes visible.',
    tag: 'OCCLUSION',
  },
  {
    id: 'signal' as const,
    title: 'The changing light',
    description:
      'A red light creates a stopping boundary. Change when it turns green.',
    tag: 'RIGHT OF WAY',
  },
  {
    id: 'roadworks' as const,
    title: 'The blocked lane',
    description:
      'Cones close the lane. Follow a smooth path through the clear adjacent lane.',
    tag: 'PATH PLANNING',
  },
];
export const VIEW_INFO: Record<
  View,
  { title: string; description: string; color: string }
> = {
  linked: {
    title: 'One moment. The whole decision.',
    description:
      'Compare the 3D road with the observed world and wheel response. Blue route: travel. Gold: caution. Gray space: unknown.',
    color: '#71dceb',
  },
  street: {
    title: 'The world around the car',
    description:
      'Drag to orbit. Scroll to zoom. Choose a scenario and press play.',
    color: '#d5ef78',
  },
  vision: {
    title: 'What is actually visible?',
    description:
      'Camera rays stop at the van. A detection appears only when the pedestrian is in view.',
    color: '#79d6e8',
  },
  prediction: {
    title: 'What might happen next?',
    description:
      'The amber trail projects the pedestrian’s current motion. It is an estimate, not certainty.',
    color: '#e9b563',
  },
  planning: {
    title: 'Which path can the car take?',
    description:
      'The filled corridor shows the chosen route: blue for travel, gold for caution. A red boundary marks where to stop.',
    color: '#d5ef78',
  },
};
export const clamp = (v: number, a: number, b: number) =>
  Math.max(a, Math.min(b, v));
export const smooth = (v: number) => {
  const x = clamp(v, 0, 1);
  return x * x * (3 - 2 * x);
};
export function laneAt(x: number, scenario: Scenario) {
  return scenario === 'roadworks'
    ? 1.7 - 3.4 * smooth((x + 10) / 8) + 3.4 * smooth((x - 9) / 8)
    : 1.7;
}
// Segment/rectangle occlusion in the horizontal plane. This van is tall enough
// to block the front camera and the pedestrian; no detection through its body.
export function blockedByVan(ax: number, az: number, bx: number, bz: number) {
  let lo = 0,
    hi = 1;
  for (const [a, d, min, max] of [
    [ax, bx - ax, -0.8, 2.8],
    [az, bz - az, -4.45, -2.35],
  ]) {
    if (Math.abs(d) < 1e-9) {
      if (a < min || a > max) return false;
    } else {
      let t0 = (min - a) / d,
        t1 = (max - a) / d;
      if (t0 > t1) [t0, t1] = [t1, t0];
      lo = Math.max(lo, t0);
      hi = Math.min(hi, t1);
      if (lo > hi) return false;
    }
  }
  return hi > 0 && lo < 1;
}
export function pedestrianVisible(x: number, z: number, pz: number) {
  const dx = 5 - (x + 1.9),
    dz = pz - z;
  return (
    dx > -1 &&
    Math.hypot(dx, dz) < 32 &&
    Math.abs(Math.atan2(dz, Math.max(0.1, dx))) < 1.3 &&
    !blockedByVan(x + 1.9, z, 5, pz)
  );
}
// A deterministic, deliberately simplified controller. All units are metres,
// seconds, and m/s. This is not Tesla software or a vehicle safety benchmark.
export function simulate(input: Settings): Frame[] {
  const s = {
    ...input,
    speedKph: clamp(input.speedKph, 10, 35),
    pedestrianDelay: clamp(input.pedestrianDelay, 1, 8),
    greenAt: clamp(input.greenAt, 6, 18),
  };
  const frames: Frame[] = [];
  let x = -17,
    speed = 0,
    acceleration = 0;
  for (let i = 0; i <= DURATION / STEP; i++) {
    const time = i * STEP,
      z = laneAt(x, s.scenario);
    const pedestrianZ = -5.7 + clamp((time - s.pedestrianDelay) * 1.05, 0, 12);
    const visible =
      s.scenario === 'crossing' && pedestrianVisible(x, z, pedestrianZ);
    const signal = time < s.greenAt ? 'red' : 'green';
    let target = s.speedKph / 3.6,
      stopX = Infinity,
      phase = 'Cruising',
      reason = 'Follow the lane at the selected target speed.',
      yielding = false;
    if (s.scenario === 'crossing' && x < 7) {
      if (x > -16) {
        target = Math.min(target, 2.6);
        phase = 'Approaching a blind spot';
        reason =
          'The van hides part of the crossing. Reduce speed before the view opens.';
      }
      if (visible && pedestrianZ > -5.8 && pedestrianZ < 4.2 && x < 2) {
        stopX = 1.2;
        yielding = true;
        phase = 'Yielding to a pedestrian';
        reason =
          'A pedestrian is approaching the route. Brake before the crossing and wait.';
      }
      if (pedestrianZ >= 4.2) {
        target = s.speedKph / 3.6;
        phase = 'Crossing is clear';
        reason =
          'The pedestrian has cleared the driving corridor. Accelerate smoothly.';
      }
    }
    if (s.scenario === 'signal' && signal === 'red' && x < 1) {
      stopX = -0.2;
      yielding = true;
      phase = 'Stopping for red';
      reason = 'The stop line limits the planned route while the light is red.';
    }
    if (s.scenario === 'signal' && signal === 'green') {
      phase = 'Proceeding on green';
      reason = 'The light is green and this simplified junction is clear.';
    }
    if (s.scenario === 'roadworks' && x < 18) {
      target = Math.min(target, 3.7);
      phase = x < 8 ? 'Passing the lane closure' : 'Returning to the lane';
      reason =
        'Use the clear adjacent lane, then merge back with a smooth steering path.';
    }
    if (Number.isFinite(stopX))
      target = Math.min(target, Math.sqrt(2 * 2.8 * Math.max(0, stopX - x)));
    const desired = clamp((target - speed) * 2.8, -3.5, 1.65);
    acceleration += clamp(desired - acceleration, -STEP * 4, STEP * 4);
    if (i > 0) {
      speed = Math.max(0, speed + acceleration * STEP);
      x += speed * STEP;
    }
    if (x >= stopX) {
      x = stopX;
      speed = 0;
      acceleration = 0;
      phase =
        s.scenario === 'signal'
          ? 'Waiting for green'
          : 'Waiting for the pedestrian';
    }
    frames.push({
      time,
      x,
      z: laneAt(x, s.scenario),
      speed,
      acceleration,
      targetSpeed: x >= stopX ? 0 : target,
      pedestrianZ,
      visible,
      yielding,
      signal,
      phase,
      reason,
      distance: Math.max(0, 5 - x - 2.2),
    });
  }
  return frames;
}
export function frameAt(frames: Frame[], time: number): Frame {
  const rawIndex = clamp(time, 0, DURATION) / STEP;
  // A checkpoint time comes from an exact simulation step. Avoid selecting the
  // previous discrete observation because multiplication/division lost an ulp.
  const index =
      Math.abs(rawIndex - Math.round(rawIndex)) < 1e-7
        ? Math.round(rawIndex)
        : rawIndex,
    a = frames[Math.floor(index)],
    b = frames[Math.min(frames.length - 1, Math.ceil(index))],
    t = index - Math.floor(index);
  return {
    ...a,
    time: clamp(time, 0, DURATION),
    x: a.x + (b.x - a.x) * t,
    z: a.z + (b.z - a.z) * t,
    speed: a.speed + (b.speed - a.speed) * t,
    pedestrianZ: a.pedestrianZ + (b.pedestrianZ - a.pedestrianZ) * t,
  };
}
