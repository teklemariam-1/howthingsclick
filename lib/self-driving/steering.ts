import { clamp } from './simulation';
export interface SteeringSample {
  target: number;
  measured: number;
  error: number;
  effort: number;
  disturbed: boolean;
}
/** Illustrative critically damped steering actuator, radians throughout.
 * Analytic responses make a seek identical to uninterrupted playback.
 * It is a separate bench experiment, not a model of Tesla's controller.
 */
export function steeringExperimentAt(
  seconds: number,
  amplitudeDegrees = 18,
  disturbance = true,
): SteeringSample {
  const t = clamp(seconds, 0, 24),
    a = (clamp(amplitudeDegrees, 5, 25) * Math.PI) / 180,
    w = 2.8;
  const response = (s: number) =>
    s < 0 ? 0 : 1 - (1 + w * s) * Math.exp(-w * s);
  const velocity = (s: number) => (s < 0 ? 0 : w * w * s * Math.exp(-w * s));
  const target = t < 1 ? 0 : t < 8 ? a : t < 17 ? -a : 0;
  let measured =
    a * response(t - 1) - 2 * a * response(t - 8) + a * response(t - 17);
  let speed =
    a * velocity(t - 1) - 2 * a * velocity(t - 8) + a * velocity(t - 17);
  const sinceBump = t - 12.5;
  if (disturbance && sinceBump >= 0) {
    const kick = (6 * Math.PI) / 180;
    measured -= kick * (1 + w * sinceBump) * Math.exp(-w * sinceBump);
    speed += kick * w * w * sinceBump * Math.exp(-w * sinceBump);
  }
  const error = target - measured;
  return {
    target,
    measured,
    error,
    effort: clamp((w * w * error - 2 * w * speed) / 2.5, -1, 1),
    disturbed: disturbance && sinceBump >= 0 && sinceBump < 1.3,
  };
}
/** Inner wheel turns more sharply in the no-slip, low-speed Ackermann construction. */
export function roadWheelAngle(centerAngle: number, side: number) {
  if (Math.abs(centerAngle) < 1e-8) return 0;
  const curvature = Math.tan(centerAngle) / 2.79;
  return Math.atan((2.79 * curvature) / (1 - side * 0.73 * curvature));
}
