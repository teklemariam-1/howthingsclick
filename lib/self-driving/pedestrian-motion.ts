import { clamp } from './simulation';
/** One full gait cycle covers 1.12 m; route speed is 1.05 m/s. */
export function pedestrianMotionAt(time: number, delay: number) {
  const elapsed = time - delay;
  const travel = clamp(elapsed * 1.05, 0, 12);
  const fade = (v: number) => {
    const u = clamp(v, 0, 1);
    return u * u * (3 - 2 * u);
  };
  return {
    cycle: (travel / 1.12) % 1,
    weight: fade(elapsed / 0.22) * fade((12 / 1.05 - elapsed) / 0.22),
  };
}
