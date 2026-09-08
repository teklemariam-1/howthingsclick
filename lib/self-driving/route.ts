import { laneAt, type Frame, type Settings } from './simulation';

export function routeAppearance(f: Frame, s: Settings) {
  const caution =
    f.yielding ||
    (s.scenario === 'crossing' && f.x > -16 && f.x < 7 && f.pedestrianZ < 4.2);
  return {
    caution,
    color: caution ? '#e8b85f' : '#4294ff',
    label: caution ? 'Gold: caution / yielding' : 'Blue: planned route',
  };
}

export function routeSamples(f: Frame, s: Settings, count = 96) {
  const start = f.x + 1.85;
  const end = f.yielding ? (s.scenario === 'signal' ? 2.05 : 3.4) : f.x + 23;
  if (end <= start) return [];
  return Array.from({ length: count }, (_, i) => {
    const x = start + ((end - start) * i) / (count - 1);
    const slope =
      (laneAt(x + 0.08, s.scenario) - laneAt(x - 0.08, s.scenario)) / 0.16;
    const length = Math.hypot(1, slope);
    return { x, z: laneAt(x, s.scenario), nx: -slope / length, nz: 1 / length };
  });
}
