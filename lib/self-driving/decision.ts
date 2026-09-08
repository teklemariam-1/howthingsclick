import { type Frame, type Settings, blockedByVan, laneAt } from './simulation';
import { engineeringTelemetry } from './engineering';

export interface Checkpoint {
  id: string;
  label: string;
  time: number;
}
export function decisionCheckpoints(
  frames: Frame[],
  settings: Settings,
): Checkpoint[] {
  const points: Checkpoint[] = [];
  const add = (id: string, label: string, frame?: Frame) => {
    if (frame) points.push({ id, label, time: frame.time });
  };
  if (settings.scenario === 'crossing') {
    const detected = frames.find((f) => f.visible);
    add(
      'hidden',
      'Hidden',
      frames.find((f) => !f.visible && f.time >= settings.pedestrianDelay) ??
        frames[0],
    );
    add('detected', 'Detected', detected);
    add(
      'braking',
      'Braking',
      frames.find(
        (f) =>
          f.yielding &&
          f.acceleration < -0.3 &&
          f.time >= (detected?.time ?? 0),
      ),
    );
    add(
      'clear',
      'Clear',
      frames.find((f) => f.pedestrianZ >= 4.2),
    );
  } else if (settings.scenario === 'signal') {
    add('approach', 'Approach', frames[0]);
    add(
      'braking',
      'Braking',
      frames.find((f) => f.acceleration < -0.3),
    );
    add(
      'stopped',
      'Stopped',
      frames.find((f) => f.phase === 'Waiting for green'),
    );
    add(
      'green',
      'Green',
      frames.find((f) => f.signal === 'green'),
    );
  } else {
    add('approach', 'Approach', frames[0]);
    add(
      'turn',
      'Turn out',
      frames.find((f) => f.x >= -11),
    );
    add(
      'passing',
      'Pass cones',
      frames.find((f) => f.x >= 3),
    );
    add(
      'return',
      'Return',
      frames.find((f) => f.x >= 11.5),
    );
  }
  return points.sort((a, b) => a.time - b.time);
}

export function decisionReadout(f: Frame, s: Settings) {
  const t = engineeringTelemetry(f, s);
  return {
    observation:
      s.scenario === 'crossing'
        ? f.visible
          ? 'Pedestrian detected'
          : 'Pedestrian not observed'
        : s.scenario === 'signal'
          ? f.signal === 'red'
            ? 'Red light'
            : 'Green light'
          : 'Cones block the lane',
    plan: f.yielding
      ? f.speed < 0.15
        ? 'Wait at the boundary'
        : 'Stop before the boundary'
      : s.scenario === 'crossing' && f.x > -16 && f.pedestrianZ < 4.2 && f.x < 7
        ? 'Slow for the blind spot'
        : s.scenario === 'roadworks' && f.x < 18
          ? 'Follow the clear lane'
          : 'Continue along the route',
    action:
      f.acceleration < -0.15
        ? 'Decelerating'
        : f.speed < 0.15 && f.yielding
          ? 'Holding position'
          : f.acceleration > 0.15
            ? 'Accelerating'
            : 'Holding speed',
    speed: f.speed * 3.6,
    targetSpeed: f.targetSpeed * 3.6,
    angle: (t.steering * 180) / Math.PI,
    ...t,
  };
}

export function decisionLayout(width: number, height: number) {
  const stacked = width < 700;
  const road = {
    x: 0,
    y: 0,
    w: stacked ? width : Math.round(width * 0.64),
    h: stacked ? Math.round(height * 0.53) : height,
  };
  return {
    stacked,
    road,
    panel: {
      x: stacked ? 0 : road.w,
      y: stacked ? road.h : 0,
      w: stacked ? width : width - road.w,
      h: stacked ? height - road.h : height,
    },
  };
}

// Known geometry illustrates visibility. Gray cells are occluded; they never
// disclose the position of a pedestrian that the simulated camera cannot see.
export function observationCell(f: Frame, s: Settings, x: number, z: number) {
  const yaw = Math.atan2(
    laneAt(f.x + 0.1, s.scenario) - laneAt(f.x - 0.1, s.scenario),
    0.2,
  );
  const dx = x - (f.x + 1.9),
    dz = z - f.z;
  let angle = Math.atan2(dz, dx) - yaw;
  angle = Math.atan2(Math.sin(angle), Math.cos(angle));
  if (Math.hypot(dx, dz) > 32 || Math.abs(angle) > 1.3) return 'outside';
  return s.scenario === 'crossing' && blockedByVan(f.x + 1.9, f.z, x, z)
    ? 'occluded'
    : 'visible';
}
