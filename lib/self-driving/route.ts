import { laneAt, clamp, smooth, type Frame, type Settings } from './simulation';

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
  // A short visual preview, not Tesla's undocumented path-horizon algorithm.
  const horizon = clamp(5.5 + f.speed * 0.6, 5.5, 8.5);
  const stop = f.yielding ? (s.scenario === 'signal' ? 2.05 : 3.4) : Infinity;
  const end = Math.min(start + horizon, stop);
  if (end <= start) return [];
  return Array.from({ length: count }, (_, i) => {
    const x = start + ((end - start) * i) / (count - 1);
    const slope =
      (laneAt(x + 0.08, s.scenario) - laneAt(x - 0.08, s.scenario)) / 0.16;
    const length = Math.hypot(1, slope);
    const progress = i / (count - 1);
    return {
      x,
      z: laneAt(x, s.scenario),
      nx: -slope / length,
      nz: 1 / length,
      opacity: 1 - smooth((progress - 0.68) / 0.32),
    };
  });
}
