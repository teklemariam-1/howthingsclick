export const TAU = Math.PI * 2;
export const CRANK_RADIUS = 0.46;
export const ROD_LENGTH = 1.58;
export const CYLINDER_SPACING = 1.31;
export const CYLINDER_Z = [-1.965, -0.655, 0.655, 1.965];
// Cylinder 1 starts at firing TDC; firing order is 1–3–4–2.
export const FIRING_PHASE = [0, 540, 180, 360];
export const normalize = (value: number, period = 720) =>
  ((value % period) + period) % period;
export function cylinderPose(degrees: number, cylinder: number) {
  const phase = normalize(degrees - FIRING_PHASE[cylinder]);
  const theta = (phase * Math.PI) / 180;
  const crankX = CRANK_RADIUS * Math.sin(theta);
  const crankY = CRANK_RADIUS * Math.cos(theta);
  const pinY = crankY + Math.sqrt(ROD_LENGTH ** 2 - crankX ** 2);
  return {
    phase,
    crankX,
    crankY,
    pinY,
    rodAngle: Math.asin(crankX / ROD_LENGTH),
  };
}
// Deliberately idealized valve events. No valve overlap is represented.
export function valveLift(phase: number, type: 'intake' | 'exhaust') {
  const start = type === 'intake' ? 360 : 180;
  const u = (normalize(phase) - start) / 180;
  return u > 0 && u < 1 ? 0.22 * Math.sin(Math.PI * u) ** 2 : 0;
}
export function strokeAt(degrees: number, cylinder = 0) {
  const phase = cylinderPose(degrees, cylinder).phase;
  return phase < 180
    ? 'Power'
    : phase < 360
      ? 'Exhaust'
      : phase < 540
        ? 'Intake'
        : 'Compression';
}
export function advanceCycle(
  degrees: number,
  elapsed: number,
  cyclesPerSecond: number,
) {
  return normalize(degrees + Math.max(0, elapsed) * 720 * cyclesPerSecond);
}
export function assemblyOffset(offset: readonly number[], fraction: number) {
  const t = Math.max(0, Math.min(1, fraction));
  const eased = t * t * (3 - 2 * t);
  return offset.map((value) => value * eased);
}

// Exploded-view choreography, not a workshop/service removal procedure.
export function assemblyStage(id: string) {
  if (/bolts|coil|oil-cap|dipstick|shield|cover$/.test(id)) return 0;
  if (
    /gasket|airbox|throttle|pcv|hoses|tank|alternator|accessory|bellhousing/.test(
      id,
    )
  )
    return 1;
  if (
    /^(head|intake|exhaust|rail|radiator|thermostat|starter|timing|sump)$/.test(
      id,
    )
  )
    return 2;
  if (/cam-|inlet-|outlet-|plug-|oil-|water-/.test(id)) return 3;
  if (/piston-|liner-|rings-|pin-/.test(id)) return 4;
  return 5;
}
export function stagedSeparation(id: string, progress: number) {
  if (progress >= 1) return 1;
  if (progress <= 0) return 0;
  const start = assemblyStage(id) * 0.11;
  return Math.max(0, Math.min(1, (progress - start) / 0.45));
}
export function flowGate(kind: 'air' | 'fuel' | 'exhaust', phase: number) {
  const angle = normalize(phase);
  if (kind === 'exhaust') return angle > 180 && angle < 360;
  return angle > 360 && angle < 540;
}
