import { clamp } from './simulation';
export type ControlDetail = 'mechanism' | 'electronics';
/** Slow, normalized illustration of a three-phase bridge. Not a PWM hardware model. */
export function motorDriverAt(seconds: number, effort: number) {
  const carrier = (((seconds * 1.6) % 1) + 1) % 1;
  const modulation = clamp(effort, -1, 1);
  return {
    carrier,
    phases: [0, 1, 2].map((i) => {
      const current =
        Math.sin(seconds * 0.8 - (i * Math.PI * 2) / 3) * modulation;
      const duty = 0.5 + 0.42 * current;
      return {
        duty,
        current,
        high: carrier < duty - 0.025,
        low: carrier > duty + 0.025,
      };
    }),
  };
}
